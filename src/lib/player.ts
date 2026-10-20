// Cola de reproducción global: la música sigue sonando al cambiar de sección.
import { useSyncExternalStore } from 'react';

export interface Track {
  id: string;
  title: string;
  subtitle: string;
  link: string;
}

export interface PlayerState {
  queue: Track[];
  index: number;
}

let state: PlayerState | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function usePlayer(): PlayerState | null {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => state,
  );
}

export function playQueue(queue: Track[], start = 0): void {
  if (!queue.length) return;
  state = { queue, index: Math.max(0, Math.min(start, queue.length - 1)) };
  emit();
}

export function nextTrack(): void {
  if (!state) return;
  if (state.index < state.queue.length - 1) state = { ...state, index: state.index + 1 };
  else state = null; // fin de la cola
  emit();
}

export function prevTrack(): void {
  if (!state || state.index === 0) return;
  state = { ...state, index: state.index - 1 };
  emit();
}

export function stopPlayer(): void {
  state = null;
  emit();
}
