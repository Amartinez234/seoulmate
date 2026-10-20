// Sonidos cortos sintetizados (sin archivos de audio).
import { useRef } from 'react';

export function useBeep() {
  const ctx = useRef<AudioContext | null>(null);
  return {
    init() {
      try {
        ctx.current ??= new AudioContext();
        void ctx.current.resume();
      } catch {
        ctx.current = null;
      }
    },
    play(freq: number, length = 0.25) {
      const c = ctx.current;
      if (!c) return;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'triangle';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.18, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + length);
      o.connect(g).connect(c.destination);
      o.start();
      o.stop(c.currentTime + length + 0.01);
    },
  };
}

