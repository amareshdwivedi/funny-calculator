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
  soundEnabled: boolean;
  animEnabled: boolean;
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
  number:      { bg: '#FFFFFF',  pressed: '#E8E4FF', text: '#3D2C8D', shadow: 'rgba(0,0,0,0.18)' },
  operator:    { bg: '#FF9500',  pressed: '#E08000', text: '#FFFFFF', shadow: 'rgba(200,100,0,0.35)' },
  equals:      { bg: '#00C896',  pressed: '#00A87A', text: '#FFFFFF', shadow: 'rgba(0,150,100,0.35)' },
  special:     { bg: '#A5D6F0',  pressed: '#7EC0E0', text: '#1A3D6E', shadow: 'rgba(0,100,180,0.25)' },
  'active-op': { bg: '#FF7700',  pressed: '#E06000', text: '#FFFFFF', shadow: 'rgba(180,80,0,0.4)' },
};

export function CalcButton({ label, variant, wide, onPress, onEmojiSpawn, onSound, soundEnabled, animEnabled }: Props) {
  const viewRef = useRef<View>(null);
  const scale = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;
  const [ripple, setRipple] = useState(0);
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (ripple === 0 || !animEnabled) return;
    rippleScale.setValue(0);
    rippleOpacity.setValue(0.45);
    Animated.parallel([
      Animated.timing(rippleScale, { toValue: 4, duration: 380, useNativeDriver: true }),
      Animated.timing(rippleOpacity, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, [ripple, animEnabled]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    if (soundEnabled) {
      if (label === '=') onSound('equals');
      else if (label === 'C') onSound('clear');
      else if (['+', '-', '×', '÷'].includes(label)) onSound('operator');
      else if (label >= '0' && label <= '9') onSound(`digit_${label}` as SoundKey);
      else onSound('digit');
    }

    if (animEnabled) {
      Animated.sequence([
        Animated.spring(scale, { toValue: 0.82, useNativeDriver: true, speed: 120, bounciness: 0 }),
        Animated.spring(scale, { toValue: 1.12, useNativeDriver: true, speed: 18, bounciness: 28 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }),
      ]).start();

      Animated.sequence([
        Animated.timing(bgAnim, { toValue: 1, duration: 70, useNativeDriver: false }),
        Animated.timing(bgAnim, { toValue: 0, duration: 220, useNativeDriver: false }),
      ]).start();

      setRipple(r => r + 1);

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
    }

    onPress();
  }, [label, onPress, onEmojiSpawn, onSound, soundEnabled, animEnabled]);

  const c = COLORS[variant] ?? COLORS.number;

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [c.bg, c.pressed],
  });

  return (
    <View ref={viewRef} style={[styles.wrapper, wide && styles.wideWrapper]}>
      <Animated.View style={[styles.shadow, wide && styles.wideShadow, { shadowColor: c.shadow, transform: [{ scale }] }]}>
        <Animated.View style={[styles.button, wide && styles.wideButton, { backgroundColor: bgColor }]}>
          <Animated.View
            style={[styles.ripple, wide && styles.wideRipple, {
              transform: [{ scale: rippleScale }],
              opacity: rippleOpacity,
              backgroundColor: c.pressed,
            }]}
            pointerEvents="none"
          />
          <TouchableOpacity
            style={[styles.touchable, wide && styles.wideTouchable]}
            onPress={handlePress}
            activeOpacity={0.85}
          >
            <Text style={[styles.label, { color: c.text }]}>{label}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const BTN = 76;
const RADIUS = 18;

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
    borderRadius: RADIUS,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 6,
  },
  wideShadow: {
    width: BTN * 2 + 10,
    borderRadius: RADIUS,
  },
  button: {
    flex: 1,
    borderRadius: RADIUS,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wideButton: {
    borderRadius: RADIUS,
  },
  ripple: {
    position: 'absolute',
    width: BTN * 0.7,
    height: BTN * 0.7,
    borderRadius: RADIUS,
    alignSelf: 'center',
  },
  wideRipple: {
    width: BTN * 1.4,
  },
  touchable: {
    width: BTN,
    height: BTN,
    borderRadius: RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wideTouchable: {
    width: BTN * 2 + 10,
  },
  label: {
    fontSize: 24,
    fontWeight: '700',
  },
});
