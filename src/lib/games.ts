// Lógica pura de los minijuegos (sin DOM), para poder probarla.

import { MEMBERS } from './bts';

export type Rng = () => number;

export function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Memoria: los 7 + el corazón morado ----------
export const MEMORY_FACES: Array<{ face: string; label: string }> = [
  ...MEMBERS.map((m) => ({ face: m.emoji, label: m.name })),
  { face: '💜', label: 'ARMY' },
];

export interface MemoryCard {
  id: number;
  face: string;
  label: string;
  matched: boolean;
}

export function memoryDeck(rng: Rng = Math.random): MemoryCard[] {
  return shuffle([...MEMORY_FACES, ...MEMORY_FACES], rng).map((f, id) => ({ id, ...f, matched: false }));
}

/** 100 puntos con el mínimo de intentos (8); cada intento extra resta 4, y el tiempo largo resta un poco. */
export function memoryScore(moves: number, seconds: number): number {
  const extra = Math.max(0, moves - MEMORY_FACES.length);
  const slow = Math.max(0, Math.floor((seconds - 30) / 10));
  return Math.max(10, 100 - extra * 4 - slow * 2);
}

// ---------- Lluvia morada: atrapá corazones ----------
export interface FallingItem {
  id: number;
  x: number; // 0..1 (centro)
  y: number; // 0..1 (0 arriba)
  speed: number; // alto por segundo
  emoji: string;
  points: number;
  label?: string; // nombre del integrante, si es un bonus
}

export interface CatchState {
  items: FallingItem[];
  catX: number; // 0..1
  score: number;
  lives: number;
  elapsed: number;
  nextSpawn: number;
  seq: number;
  caught: number;
  over: boolean;
  lastBonus: string | null;
}

export const CATCH_ITEMS = ['💜', '💜', '💜', '🎤', '🎧', '🌸', '💿'];
export const CATCH_LIVES = 3;
export const CAT_HALF_WIDTH = 0.11; // la mitad del ancho del gatito, en proporción al área
export const CATCH_LINE = 0.86; // altura donde el gatito atrapa

export function newCatch(): CatchState {
  return { items: [], catX: 0.5, score: 0, lives: CATCH_LIVES, elapsed: 0, nextSpawn: 0.4, seq: 0, caught: 0, over: false, lastBonus: null };
}

/** Avanza el juego dt segundos. La velocidad y la frecuencia suben con el tiempo. */
export function stepCatch(s: CatchState, dt: number, rng: Rng = Math.random): CatchState {
  if (s.over) return s;
  const elapsed = s.elapsed + dt;
  let { score, lives, seq, caught, nextSpawn, lastBonus } = s;
  const items: FallingItem[] = [];
  for (const it of s.items) {
    const y = it.y + it.speed * dt;
    if (it.y < CATCH_LINE && y >= CATCH_LINE && Math.abs(it.x - s.catX) <= CAT_HALF_WIDTH + 0.04) {
      score += it.points;
      caught += 1;
      if (it.label) lastBonus = it.label;
      continue;
    }
    if (y > 1.05) {
      if (it.points === 1) lives -= 1; // los bonus de integrantes no cuentan como perdidos
      continue;
    }
    items.push({ ...it, y });
  }
  nextSpawn -= dt;
  if (nextSpawn <= 0) {
    const bonus = rng() < 0.1 ? MEMBERS[Math.floor(rng() * MEMBERS.length)] : null;
    const level = Math.min(1, elapsed / 60);
    items.push({
      id: ++seq,
      x: 0.08 + rng() * 0.84,
      y: -0.05,
      speed: 0.28 + level * 0.42 + rng() * 0.1,
      emoji: bonus ? bonus.emoji : CATCH_ITEMS[Math.floor(rng() * CATCH_ITEMS.length)],
      points: bonus ? 5 : 1,
      label: bonus?.name,
    });
    nextSpawn = Math.max(0.38, 1.05 - level * 0.62) + rng() * 0.2;
  }
  return { ...s, items, score, lives, seq, caught, nextSpawn, elapsed, lastBonus, over: lives <= 0 };
}

export function moveCat(s: CatchState, x: number): CatchState {
  return { ...s, catX: Math.max(CAT_HALF_WIDTH, Math.min(1 - CAT_HALF_WIDTH, x)) };
}

// ---------- Concierto: encendé las luces ----------
export const LIGHTS_SECONDS = 30;
export const LIGHTS_SEATS = 9;

export interface Light {
  seat: number;
  kind: 'luz' | 'dorada';
  until: number; // segundo en que se apaga sola
}

/** Elige un asiento libre y cuánto tiempo queda encendida la luz (cada vez menos). */
export function spawnLight(active: Light[], t: number, rng: Rng = Math.random): Light | null {
  const free = Array.from({ length: LIGHTS_SEATS }, (_, i) => i).filter((h) => !active.some((m) => m.seat === h));
  if (!free.length) return null;
  const seat = free[Math.floor(rng() * free.length)];
  const stay = Math.max(0.55, 1.25 - (t / LIGHTS_SECONDS) * 0.6);
  return { seat, kind: rng() < 0.1 ? 'dorada' : 'luz', until: t + stay };
}

export const lightPoints = (m: Light) => (m.kind === 'dorada' ? 3 : 1);

// ---------- Quiz ARMY ----------
export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number; // índice correcto
}

export const QUIZ_ROUND = 10;

/** Elige preguntas al azar y mezcla sus opciones, manteniendo cuál es la correcta. */
export function quizRound(bank: QuizQuestion[], rng: Rng = Math.random, n = QUIZ_ROUND): QuizQuestion[] {
  return shuffle(bank, rng)
    .slice(0, n)
    .map((x) => {
      const order = shuffle(x.options.map((_, i) => i), rng);
      return { q: x.q, options: order.map((i) => x.options[i]), answer: order.indexOf(x.answer) };
    });
}
