import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import type { OperatorType } from '../hooks/useCalculator';

interface Props {
  value: string;
  expression: string;
  activeOperator: OperatorType;
  isResult: boolean;
}

export function Display({ value, expression, isResult }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const prevValue = useRef(value);

  useEffect(() => {
    if (value === prevValue.current) return;
    prevValue.current = value;

    if (value.includes('Oops') || value.includes('WOW')) {
      Animated.sequence([
        Animated.timing(shakeX, { toValue: -12, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 12, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -10, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 10, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 0, duration: 55, useNativeDriver: true }),
      ]).start();
    } else if (isResult) {
      // Celebration: big bounce + glow
      Animated.parallel([
        Animated.sequence([
          Animated.spring(scale, { toValue: 1.3, useNativeDriver: true, speed: 25, bounciness: 22 }),
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }),
        ]),
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 250, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
        ]),
      ]).start();
    } else {
      // Quick digit pop
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.07, useNativeDriver: true, speed: 80, bounciness: 6 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }),
      ]).start();
    }
  }, [value, isResult]);

  const fontSize = value.length > 10 ? 30 : value.length > 7 ? 42 : value.length > 4 ? 56 : 70;

  const textColor = glowAnim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: ['#FFFFFF', '#FFE066', '#FF6B9D', '#69F0AE'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.glass}>
        <Text style={styles.expression} numberOfLines={1} adjustsFontSizeToFit>
          {expression || ' '}
        </Text>
        <Animated.View style={{ transform: [{ scale }, { translateX: shakeX }] }}>
          <Animated.Text
            style={[styles.value, { fontSize, color: textColor }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {value}
          </Animated.Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  glass: {
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  expression: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 20,
    marginBottom: 4,
    fontWeight: '500',
  },
  value: {
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    letterSpacing: -1,
  },
});
