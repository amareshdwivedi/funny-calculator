import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

interface Props {
  id: string;
  emoji: string;
  startX: number;
  startY: number;
  onDone: (id: string) => void;
}

export function FlyingEmoji({ id, emoji, startX, startY, onDone }: Props) {
  const y = useRef(new Animated.Value(0)).current;
  const x = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  // Freeze random values on mount so they don't change between renders
  const dx = useRef((Math.random() - 0.5) * 140).current;
  const dy = useRef(-(160 + Math.random() * 140)).current;
  const dur = useRef(850 + Math.random() * 400).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1.6, useNativeDriver: true, speed: 35, bounciness: 18 }),
      Animated.timing(y, { toValue: dy, duration: dur, useNativeDriver: true }),
      Animated.timing(x, { toValue: dx, duration: dur, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(rotate, { toValue: 1, duration: dur * 0.5, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: -0.4, duration: dur * 0.5, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(dur * 0.4),
        Animated.timing(opacity, { toValue: 0, duration: dur * 0.6, useNativeDriver: true }),
      ]),
    ]).start(() => onDone(id));
  }, []);

  const spin = rotate.interpolate({ inputRange: [-1, 1], outputRange: ['-35deg', '35deg'] });

  return (
    <Animated.Text
      style={[
        styles.emoji,
        {
          left: startX - 18,
          top: startY - 18,
          opacity,
          transform: [{ translateX: x }, { translateY: y }, { scale }, { rotate: spin }],
        },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  emoji: {
    position: 'absolute',
    fontSize: 30,
    zIndex: 9999,
  },
});
