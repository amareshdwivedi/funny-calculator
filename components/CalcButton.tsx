import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Animated,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import type { SoundKey } from '../hooks/useSounds';

export type ButtonVariant = 'number' | 'operator' | 'equals' | 'special' | 'active-op';

interface Props {
  label: string;
  variant: ButtonVariant;
  wide?: boolean;
  onPress: () => void;
  onEmojiSpawn: (emojis: string[], x: number, y: number) => void;
  onSound: (key: SoundKey) => void;
}

const EMOJIS: Record<string, string[]> = {
  '0': ['🎈', '⭐', '🌟', '🎀'],
  '1': ['🐱', '🎉', '✨', '🦊'],
  '2': ['🐶', '🎊', '💫', '🐻'],
  '3': ['🦊', '🌈', '⚡', '🐯'],
  '4': ['🐸', '🎵', '🎶', '🦁'],
  '5': ['🦄', '🌸', '🍭', '🌺'],
  '6': ['🐼', '🎠', '🎡', '🎢'],
  '7': ['🦋', '🌟', '💫', '✨'],
  '8': ['🐯', '🎭', '🎪', '🎨'],
  '9': ['🦁', '🎯', '🎱', '🎳'],
  '+': ['➕', '🌈', '💪', '🤩'],
  '-': ['💨', '❄️', '💧', '🌀'],
  '×': ['💥', '🔥', '⚡', '🌟'],
  '÷': ['🍕', '🍰', '✂️', '🎯'],
  '=': ['🎉', '🎊', '✨', '🌟', '💥', '🎈', '🦄', '🌈'],
  'C': ['🧹', '💨', '🌀', '🧽'],
  '+/-': ['🔄', '↕️', '🙃', '😜'],
  '%': ['💯', '📊', '🎯', '🏆'],
};

const COLORS: Record<ButtonVariant, { bg: string; pressed: string; text: string; shadow: string }> = {
  number:      { bg: '#FFF59D', pressed: '#FFD54F', text: '#4A148C', shadow: '#F57F17' },
  operator:    { bg: '#FF8A80', pressed: '#FF1744', text: '#fff',    shadow: '#B71C1C' },
  equals:      { bg: '#69F0AE', pressed: '#00E676', text: '#1B5E20', shadow: '#2E7D32' },
  special:     { bg: '#80D8FF', pressed: '#00B0FF', text: '#01579B', shadow: '#0277BD' },
  'active-op': { bg: '#FF6D00', pressed: '#E65100', text: '#fff',    shadow: '#BF360C' },
};

export function CalcButton({ label, variant, wide, onPress, onEmojiSpawn, onSound }: Props) {
  const viewRef = useRef<View>(null);
  const scale = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;
  const [ripple, setRipple] = useState(0);
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (ripple === 0) return;
    rippleScale.setValue(0);
    rippleOpacity.setValue(0.55);
    Animated.parallel([
      Animated.timing(rippleScale, { toValue: 4, duration: 380, useNativeDriver: true }),
      Animated.timing(rippleOpacity, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, [ripple]);

  const handlePress = useCallback(() => {
    // Haptics
    if (label === '=') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (label === 'C') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Sound
    if (label === '=') onSound('equals');
    else if (label === 'C') onSound('clear');
    else if (['+', '-', '×', '÷'].includes(label)) onSound('operator');
    else if (label >= '0' && label <= '9') onSound(`digit_${label}` as SoundKey);
    else onSound('digit');

    // Bounce animation
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.78, useNativeDriver: true, speed: 120, bounciness: 0 }),
      Animated.spring(scale, { toValue: 1.18, useNativeDriver: true, speed: 18, bounciness: 30 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }),
    ]).start();

    // Background flash
    Animated.sequence([
      Animated.timing(bgAnim, { toValue: 1, duration: 70, useNativeDriver: false }),
      Animated.timing(bgAnim, { toValue: 0, duration: 220, useNativeDriver: false }),
    ]).start();

    // Ripple
    setRipple(r => r + 1);

    // Flying emojis — measure absolute position
    viewRef.current?.measureInWindow((x, y, w, h) => {
      const cx = isFinite(x) && isFinite(w) && w > 0 ? x + w / 2 : 180;
      const cy = isFinite(y) && isFinite(h) && h > 0 ? y + h / 2 : 400;
      const pool = EMOJIS[label] ?? ['⭐'];
      const count = label === '=' ? 6 : label === 'C' ? 3 : 2;
      const picked = Array.from({ length: count }, () =>
        pool[Math.floor(Math.random() * pool.length)]
      );
      onEmojiSpawn(picked, cx, cy);
    });

    onPress();
  }, [label, onPress, onEmojiSpawn, onSound]);

  const c = COLORS[variant] ?? COLORS.number;

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [c.bg, c.pressed],
  });

  return (
    <View ref={viewRef} style={[styles.wrapper, wide && styles.wideWrapper]}>
      <Animated.View style={[styles.shadow, wide && styles.wideWrapper, { shadowColor: c.shadow, transform: [{ scale }] }]}>
        <Animated.View
          style={[styles.button, wide && styles.wideButton, { backgroundColor: bgColor }]}
        >
          {/* Ripple ring */}
          <Animated.View
            style={[
              styles.ripple,
              {
                transform: [{ scale: rippleScale }],
                opacity: rippleOpacity,
                backgroundColor: c.pressed,
              },
            ]}
            pointerEvents="none"
          />
          <TouchableOpacity
            style={[styles.touchable, wide && styles.wideTouchable]}
            onPress={handlePress}
            activeOpacity={1}
          >
            <Text style={[styles.label, { color: c.text }]}>{label}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const BTN = 74;

const styles = StyleSheet.create({
  wrapper: {
    width: BTN,
    height: BTN,
  },
  wideWrapper: {
    width: BTN * 2 + 10,
    height: BTN,
  },
  shadow: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  button: {
    flex: 1,
    borderRadius: BTN / 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wideButton: {
    borderRadius: BTN / 2,
  },
  ripple: {
    position: 'absolute',
    width: BTN * 0.6,
    height: BTN * 0.6,
    borderRadius: BTN * 0.3,
    alignSelf: 'center',
  },
  touchable: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wideTouchable: {
    width: BTN * 2 + 10,
  },
  label: {
    fontSize: 26,
    fontWeight: '700',
  },
});
