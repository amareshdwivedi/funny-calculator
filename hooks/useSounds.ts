import { useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export type SoundKey =
  | 'digit_0' | 'digit_1' | 'digit_2' | 'digit_3' | 'digit_4'
  | 'digit_5' | 'digit_6' | 'digit_7' | 'digit_8' | 'digit_9'
  | 'digit' | 'operator' | 'equals' | 'clear' | 'error';

const SR = 22050;

function wavHeader(numSamples: number): Uint8Array {
  const buf = new ArrayBuffer(44 + numSamples);
  const v = new DataView(buf);
  const b = new Uint8Array(buf);
  b.set([82, 73, 70, 70], 0);
  v.setUint32(4, 36 + numSamples, true);
  b.set([87, 65, 86, 69], 8);
  b.set([102, 109, 116, 32], 12);
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, SR, true);
  v.setUint32(28, SR, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  b.set([100, 97, 116, 97], 36);
  v.setUint32(40, numSamples, true);
  return b;
}

// Each digit gets a unique base pitch on the scale (C4 → D5), rising blip
const DIGIT_HZ = [262, 294, 330, 349, 392, 440, 494, 523, 587, 659];

function makeDigitBlip(baseHz: number): Uint8Array {
  const n = Math.round(SR * 0.13);
  const b = wavHeader(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const hz = baseHz + baseHz * 0.6 * t; // sweep up by 60% of base
    phase += (2 * Math.PI * hz) / SR;
    const env = Math.min(1, i / 60) * Math.pow(1 - t, 0.6);
    const sample = Math.sin(phase) * 0.8 + Math.sin(phase * 3) * 0.2;
    b[44 + i] = 128 + Math.round(85 * sample * env);
  }
  return b;
}

// Fallback generic digit blip
function makeDigit(): Uint8Array {
  return makeDigitBlip(480);
}

// Springy cartoon "boing" — for operator presses
function makeOperator(): Uint8Array {
  const n = Math.round(SR * 0.26);
  const b = wavHeader(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    // Spring: high pitch decays, wobbles, settles
    const hz = 150 + 650 * Math.exp(-t * 4) * Math.abs(Math.cos(Math.PI * t * 3));
    phase += (2 * Math.PI * hz) / SR;
    const env = Math.min(1, i / 80) * Math.exp(-t * 3);
    b[44 + i] = 128 + Math.round(90 * Math.sin(phase) * env);
  }
  return b;
}

// 3-note ascending fanfare — satisfying "ta-da!" for equals
function makeEquals(): Uint8Array {
  const notes = [
    { hz: 523, ms: 110 },   // C5
    { hz: 784, ms: 100 },   // G5
    { hz: 1047, ms: 220 },  // C6 (held longer)
  ];
  const totalN = notes.reduce((s, note) => s + Math.round(SR * note.ms / 1000), 0);
  const b = wavHeader(totalN);
  let offset = 0;
  for (const note of notes) {
    const n = Math.round(SR * note.ms / 1000);
    let phase = 0;
    for (let i = 0; i < n; i++) {
      phase += (2 * Math.PI * note.hz) / SR;
      const env = Math.min(1, i / 80, (n - i) / 100);
      b[44 + offset + i] = 128 + Math.round(82 * Math.sin(phase) * env);
    }
    offset += n;
  }
  return b;
}

// Descending "whoooooop" — like a deflating balloon for clear
function makeClear(): Uint8Array {
  const n = Math.round(SR * 0.32);
  const b = wavHeader(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const hz = 900 * Math.exp(-t * 2.8) + 120;
    phase += (2 * Math.PI * hz) / SR;
    const env = Math.min(1, i / 80) * (1 - t * 0.6);
    b[44 + i] = 128 + Math.round(88 * Math.sin(phase) * env);
  }
  return b;
}

// Classic "wah-wah" trombone — cartoon sad sound for errors
function makeError(): Uint8Array {
  const n = Math.round(SR * 0.5);
  const b = wavHeader(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    // Two falling "wah" slides
    const cycle = (t * 2) % 1;
    const hz = 500 - 220 * cycle;
    // Wah = low-frequency amplitude modulation
    const wah = 0.45 + 0.55 * Math.sin(2 * Math.PI * 4.5 * t);
    phase += (2 * Math.PI * hz) / SR;
    const env = Math.min(1, i / 180, (n - i) / 350) * wah;
    b[44 + i] = 128 + Math.round(82 * Math.sin(phase) * env);
  }
  return b;
}

const MAKERS: Record<SoundKey, () => Uint8Array> = {
  digit_0: () => makeDigitBlip(DIGIT_HZ[0]),
  digit_1: () => makeDigitBlip(DIGIT_HZ[1]),
  digit_2: () => makeDigitBlip(DIGIT_HZ[2]),
  digit_3: () => makeDigitBlip(DIGIT_HZ[3]),
  digit_4: () => makeDigitBlip(DIGIT_HZ[4]),
  digit_5: () => makeDigitBlip(DIGIT_HZ[5]),
  digit_6: () => makeDigitBlip(DIGIT_HZ[6]),
  digit_7: () => makeDigitBlip(DIGIT_HZ[7]),
  digit_8: () => makeDigitBlip(DIGIT_HZ[8]),
  digit_9: () => makeDigitBlip(DIGIT_HZ[9]),
  digit: makeDigit,
  operator: makeOperator,
  equals: makeEquals,
  clear: makeClear,
  error: makeError,
};

function toBase64(u8: Uint8Array): string {
  let s = '';
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s);
}

export function useSounds() {
  const pool = useRef<Partial<Record<SoundKey, Audio.Sound>>>({});

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        for (const [key, make] of Object.entries(MAKERS) as [SoundKey, () => Uint8Array][]) {
          const uri = (FileSystem.cacheDirectory ?? '') + `funny-${key}.wav`;
          await FileSystem.writeAsStringAsync(uri, toBase64(make()), {
            encoding: FileSystem.EncodingType.Base64,
          });
          const { sound } = await Audio.Sound.createAsync({ uri }, { volume: 0.75 });
          if (mounted) pool.current[key] = sound;
        }
      } catch (_) {
        // Sounds unavailable — haptics still provide feedback
      }
    })();

    return () => {
      mounted = false;
      Object.values(pool.current).forEach(s => s?.unloadAsync());
    };
  }, []);

  const play = useCallback((key: SoundKey) => {
    pool.current[key]?.replayAsync().catch(() => {});
  }, []);

  return { play };
}
