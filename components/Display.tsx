import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import type { OperatorType } from '../hooks/useCalculator';

interface Props {
  value: string;
  expression: string;
  activeOperator: OperatorType;
  isResult: boolean;
  animEnabled: boolean;
}

export function Display({ value, expression, isResult, animEnabled }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const prevValue = useRef(value);

  useEffect(() => {
    if (value === prevValue.current || !animEnabled) return;
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
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.25, useNativeDriver: true, speed: 25, bounciness: 20 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10 }),
      ]).start();
    } else {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.06, useNativeDriver: true, speed: 80, bounciness: 6 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }),
      ]).start();
    }
  }, [value, isResult, animEnabled]);

  const fontSize = value.length > 10 ? 30 : value.length > 7 ? 42 : value.length > 4 ? 56 : 70;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.expression} numberOfLines={1} adjustsFontSizeToFit>
          {expression || ' '}
        </Text>
        <Animated.View style={{ transform: [{ scale }, { translateX: shakeX }] }}>
          <Text style={[styles.value, { fontSize }]} numberOfLines={1} adjustsFontSizeToFit>
            {value}
          </Text>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 18,
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  expression: {
    color: 'rgba(61,44,141,0.5)',
    fontSize: 18,
    marginBottom: 4,
    fontWeight: '500',
  },
  value: {
    fontWeight: '800',
    color: '#3D2C8D',
    letterSpacing: -1,
  },
});
