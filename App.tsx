import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Platform,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Display } from './components/Display';
import { CalcButton, ButtonVariant } from './components/CalcButton';
import { FlyingEmoji } from './components/FlyingEmoji';
import { useCalculator, OperatorType } from './hooks/useCalculator';
import { useSounds, SoundKey } from './hooks/useSounds';

interface EmojiItem {
  id: string;
  emoji: string;
  x: number;
  y: number;
}

let counter = 0;

type ButtonDef = {
  label: string;
  variant: ButtonVariant;
  wide?: boolean;
  action: () => void;
};

export default function App() {
  const calc = useCalculator();
  const { play } = useSounds();
  const [emojis, setEmojis] = useState<EmojiItem[]>([]);
  const [soundOn, setSoundOn] = useState(true);
  const [animOn, setAnimOn] = useState(true);
  const inputRef = useRef<TextInput>(null);

  const spawnEmojis = useCallback((list: string[], x: number, y: number) => {
    setEmojis(prev => [
      ...prev,
      ...list.map(emoji => ({ id: `e-${counter++}`, emoji, x, y })),
    ]);
  }, []);

  const removeEmoji = useCallback((id: string) => {
    setEmojis(prev => prev.filter(e => e.id !== id));
  }, []);

  const focusKeyboard = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyPress = useCallback((e: any) => {
    const k: string = e.nativeEvent.key;
    if (k >= '0' && k <= '9') calc.inputDigit(k);
    else if (k === '.') calc.inputDecimal();
    else if (k === '+') calc.setOperator('+');
    else if (k === '-') calc.setOperator('-');
    else if (k === '*') calc.setOperator('×');
    else if (k === '/') calc.setOperator('÷');
    else if (k === 'Enter' || k === '=') calc.calculate();
    else if (k === 'Escape' || k === 'Delete') calc.clear();
    else if (k === 'Backspace') calc.backspace();
  }, [calc]);

  const opVariant = (op: OperatorType): ButtonVariant =>
    calc.activeOperator === op ? 'active-op' : 'operator';

  const rows: ButtonDef[][] = [
    [
      { label: 'C',   variant: 'special',            action: calc.clear },
      { label: '+/-', variant: 'special',             action: calc.toggleSign },
      { label: '%',   variant: 'special',             action: calc.percentage },
      { label: '÷',   variant: opVariant('÷'),        action: () => calc.setOperator('÷') },
    ],
    [
      { label: '7', variant: 'number', action: () => calc.inputDigit('7') },
      { label: '8', variant: 'number', action: () => calc.inputDigit('8') },
      { label: '9', variant: 'number', action: () => calc.inputDigit('9') },
      { label: '×', variant: opVariant('×'), action: () => calc.setOperator('×') },
    ],
    [
      { label: '4', variant: 'number', action: () => calc.inputDigit('4') },
      { label: '5', variant: 'number', action: () => calc.inputDigit('5') },
      { label: '6', variant: 'number', action: () => calc.inputDigit('6') },
      { label: '-', variant: opVariant('-'), action: () => calc.setOperator('-') },
    ],
    [
      { label: '1', variant: 'number', action: () => calc.inputDigit('1') },
      { label: '2', variant: 'number', action: () => calc.inputDigit('2') },
      { label: '3', variant: 'number', action: () => calc.inputDigit('3') },
      { label: '+', variant: opVariant('+'), action: () => calc.setOperator('+') },
    ],
    [
      { label: '0', variant: 'number', wide: true, action: () => calc.inputDigit('0') },
      { label: '.', variant: 'number', action: calc.inputDecimal },
      { label: '=', variant: 'equals', action: calc.calculate },
    ],
  ];

  return (
    <LinearGradient colors={['#7B52D3', '#5535A0', '#3D2280']} style={styles.gradient}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity onPress={focusKeyboard} activeOpacity={1} style={styles.root}>

          {/* Header */}
          <Text style={styles.title}>🧮 Funny Calc! 🎉</Text>

          {/* Display */}
          <Display
            value={calc.displayValue}
            expression={calc.expression}
            activeOperator={calc.activeOperator}
            isResult={calc.isResult}
            animEnabled={animOn}
          />

          {/* Button pad */}
          <View style={styles.pad}>
            {rows.map((row, ri) => (
              <View key={ri} style={styles.row}>
                {row.map(btn => (
                  <CalcButton
                    key={btn.label}
                    label={btn.label}
                    variant={btn.variant}
                    wide={btn.wide}
                    onPress={btn.action}
                    onEmojiSpawn={spawnEmojis}
                    onSound={play as (k: SoundKey) => void}
                    soundEnabled={soundOn}
                    animEnabled={animOn}
                  />
                ))}
              </View>
            ))}
          </View>

          {/* Keyboard hint */}
          <Text style={styles.hint}>⌨️ Tap here to use keyboard</Text>

          {/* Sound & Animation toggles */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, !soundOn && styles.toggleOff]}
              onPress={() => setSoundOn(v => !v)}
            >
              <Text style={styles.toggleText}>{soundOn ? '🔊 Sound' : '🔇 Sound'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, !animOn && styles.toggleOff]}
              onPress={() => setAnimOn(v => !v)}
            >
              <Text style={styles.toggleText}>{animOn ? '✨ Anim' : '✦ Anim'}</Text>
            </TouchableOpacity>
          </View>

        </TouchableOpacity>

        {/* Hidden input for physical keyboard */}
        <TextInput
          ref={inputRef}
          style={styles.hidden}
          onKeyPress={handleKeyPress}
          showSoftInputOnFocus={false}
          keyboardType="numbers-and-punctuation"
          value=""
          onChangeText={() => {}}
          caretHidden
        />

        {/* Flying emoji overlay */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {emojis.map(e => (
            <FlyingEmoji
              key={e.id}
              id={e.id}
              emoji={e.emoji}
              startX={e.x}
              startY={e.y}
              onDone={removeEmoji}
            />
          ))}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  root: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  pad: {
    gap: 10,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  hint: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
    marginBottom: 4,
  },
  toggleBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  toggleOff: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  toggleText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    bottom: 0,
    left: 0,
  },
});
