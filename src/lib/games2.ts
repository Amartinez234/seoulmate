// Lógica pura de la segunda tanda de minijuegos (sin DOM), para poder probarla.
import { ALBUMS, MEMBER_CLUES, SONG_TITLES, WORDSEARCH_WORDS, type Album } from './btsData';
import { MEMBERS } from './bts';
import { shuffle, type Rng } from './games';

const pick = <T>(list: T[], rng: Rng) => list[Math.floor(rng() * list.length)];

// ---------- Ritmo: notas en 3 carriles ----------
export interface Note {
  id: number;
  lane: number; // 0..2
  t: number; // segundo en que llega a la línea
}

export const RHYTHM_SECONDS = 40;
export const RHYTHM_PERFECT = 0.09;
export const RHYTHM_GOOD = 0.2;

/** Partitura al azar a 100 bpm que se va acelerando un poco. */
export function rhythmChart(rng: Rng = Math.random, seconds = RHYTHM_SECONDS): Note[] {
  const notes: Note[] = [];
  let t = 1.6;
  let id = 0;
  while (t < seconds) {
    notes.push({ id: ++id, lane: Math.floor(rng() * 3), t });
    const beat = t < seconds / 2 ? 0.6 : 0.45;
    t += beat * (rng() < 0.25 ? 0.5 : 1);
  }
  return notes;
}

/** Puntaje de un toque: 3 perfecto, 1 bien, 0 fuera de tiempo. */
export function judgeTap(delta: number): 0 | 1 | 3 {
  const d = Math.abs(delta);
  if (d <= RHYTHM_PERFECT) return 3;
  if (d <= RHYTHM_GOOD) return 1;
  return 0;
}

// ---------- Coreografía (Simón dice) ----------
export const SIMON_PADS = 4;
export function extendSequence(seq: number[], rng: Rng = Math.random): number[] {
  return [...seq, Math.floor(rng() * SIMON_PADS)];
}

// ---------- Gatito saltarín ----------
export interface Hopper {
  y: number; // altura sobre el piso (0 = piso), en proporción al área
  vy: number;
  obstacles: Array<{ id: number; x: number; w: number; h: number; kind: string }>;
  coins: Array<{ id: number; x: number; y: number }>;
  speed: number;
  dist: number;
  score: number;
  seq: number;
  next: number;
  over: boolean;
}

export const HOP_GRAVITY = 3.2;
export const HOP_JUMP = 1.45;
export const HOP_CAT_X = 0.18;
export const HOP_CAT_W = 0.12;
export const HOP_CAT_H = 0.16;

export function newHopper(): Hopper {
  return { y: 0, vy: 0, obstacles: [], coins: [], speed: 0.38, dist: 0, score: 0, seq: 0, next: 1.2, over: false };
}

export function jump(s: Hopper): Hopper {
  return s.y <= 0.001 && !s.over ? { ...s, vy: HOP_JUMP } : s;
}

export function stepHopper(s: Hopper, dt: number, rng: Rng = Math.random): Hopper {
  if (s.over) return s;
  let vy = s.vy - HOP_GRAVITY * dt;
  let y = s.y + vy * dt;
  if (y <= 0) {
    y = 0;
    vy = 0;
  }
  const speed = Math.min(0.85, s.speed + dt * 0.008);
  let { seq, next, score } = s;
  const obstacles = s.obstacles.map((o) => ({ ...o, x: o.x - speed * dt })).filter((o) => o.x + o.w > -0.05);
  let coins = s.coins.map((c) => ({ ...c, x: c.x - speed * dt })).filter((c) => c.x > -0.05);
  next -= dt;
  if (next <= 0) {
    const h = 0.09 + rng() * 0.08;
    obstacles.push({ id: ++seq, x: 1.05, w: 0.07, h, kind: pick(['🎤', '📦', '🌵'], rng) });
    if (rng() < 0.7) coins.push({ id: ++seq, x: 1.05 + 0.035, y: h + 0.14 + rng() * 0.12 });
    next = Math.max(0.75, 1.6 - speed) + rng() * 0.6;
  }
  // Monedas (corazones) atrapadas en el aire.
  const catL = HOP_CAT_X - HOP_CAT_W / 2;
  const catR = HOP_CAT_X + HOP_CAT_W / 2;
  const before = coins.length;
  coins = coins.filter((c) => !(c.x > catL - 0.03 && c.x < catR + 0.03 && Math.abs(c.y - (y + HOP_CAT_H / 2)) < 0.12));
  score += (before - coins.length) * 3;
  // Choque: margen generoso para que sea justo.
  const hit = obstacles.some((o) => o.x < catR - 0.015 && o.x + o.w > catL + 0.015 && y < o.h - 0.015);
  const dist = s.dist + speed * dt;
  return { ...s, y, vy, speed, obstacles, coins, seq, next, dist, score: score + (Math.floor(dist * 4) - Math.floor(s.dist * 4)), over: hit };
}

// ---------- ¿Quién es? ----------
export interface ClueQuestion {
  clue: string;
  options: string[];
  answer: number;
}

export function clueRound(rng: Rng = Math.random, n = 8): ClueQuestion[] {
  return shuffle(MEMBER_CLUES, rng)
    .slice(0, n)
    .map(({ member, clue }) => {
      const others = shuffle(
        MEMBERS.map((m) => m.name).filter((x) => x !== member),
        rng,
      ).slice(0, 3);
      const options = shuffle([member, ...others], rng);
      return { clue, options, answer: options.indexOf(member) };
    });
}

// ---------- Línea de tiempo ----------
export function timelineRound(rng: Rng = Math.random, n = 5): Album[] {
  return shuffle(ALBUMS, rng).slice(0, n);
}

export const isChronological = (list: Album[]) => list.every((a, i) => i === 0 || list[i - 1].year < a.year);

/** Cuántos álbumes quedaron en su posición correcta. */
export function timelineHits(list: Album[]): number {
  const sorted = [...list].sort((a, b) => a.year - b.year);
  return list.filter((a, i) => a.title === sorted[i].title).length;
}

// ---------- Sopa de letras ----------
export interface Placed {
  word: string;
  cells: number[]; // índices en la grilla
}

export interface WordGrid {
  size: number;
  letters: string[];
  words: Placed[];
}

const DIRS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [-1, 1],
];
const ABC = 'ABCDEFGHIJKLMNOPRSTUVY';

export function makeWordGrid(rng: Rng = Math.random, size = 10, words = WORDSEARCH_WORDS): WordGrid {
  for (let attempt = 0; attempt < 50; attempt++) {
    const letters: string[] = Array(size * size).fill('');
    const placed: Placed[] = [];
    let ok = true;
    for (const word of [...words].sort((a, b) => b.length - a.length)) {
      let done = false;
      for (let tries = 0; tries < 200 && !done; tries++) {
        const [dr, dc] = DIRS[Math.floor(rng() * DIRS.length)];
        const r0 = Math.floor(rng() * size);
        const c0 = Math.floor(rng() * size);
        const cells: number[] = [];
        for (let k = 0; k < word.length; k++) {
          const r = r0 + dr * k;
          const c = c0 + dc * k;
          if (r < 0 || r >= size || c < 0 || c >= size) break;
          const idx = r * size + c;
          if (letters[idx] && letters[idx] !== word[k]) break;
          cells.push(idx);
        }
        if (cells.length !== word.length) continue;
        cells.forEach((idx, k) => (letters[idx] = word[k]));
        placed.push({ word, cells });
        done = true;
      }
      if (!done) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    for (let i = 0; i < letters.length; i++) if (!letters[i]) letters[i] = ABC[Math.floor(rng() * ABC.length)];
    return { size, letters, words: placed };
  }
  throw new Error('No se pudo armar la sopa de letras');
}

/** Celdas de una línea recta entre dos celdas (horizontal, vertical o diagonal); null si no es recta. */
export function lineCells(size: number, a: number, b: number): number[] | null {
  const [r1, c1, r2, c2] = [Math.floor(a / size), a % size, Math.floor(b / size), b % size];
  const dr = Math.sign(r2 - r1);
  const dc = Math.sign(c2 - c1);
  const len = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1));
  if (!(r1 === r2 || c1 === c2 || Math.abs(r2 - r1) === Math.abs(c2 - c1))) return null;
  return Array.from({ length: len + 1 }, (_, k) => (r1 + dr * k) * size + (c1 + dc * k));
}

/** Busca la palabra que coincide con la selección (en cualquier sentido). */
export function matchWord(grid: WordGrid, cells: number[]): Placed | null {
  const key = cells.join(',');
  const rev = [...cells].reverse().join(',');
  return grid.words.find((w) => w.cells.join(',') === key || w.cells.join(',') === rev) ?? null;
}

// ---------- Adiviná la canción (ahorcado) ----------
export const HANGMAN_LIVES = 6;
export const normalizeLetter = (ch: string) => ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
export const isLetter = (ch: string) => /[A-Z0-9]/.test(normalizeLetter(ch));

export function pickSong(rng: Rng = Math.random, exclude: string[] = []): string {
  const pool = SONG_TITLES.filter((s) => !exclude.includes(s));
  return pick(pool.length ? pool : SONG_TITLES, rng);
}

export function maskSong(title: string, guessed: string[]): string {
  return [...title].map((ch) => (!isLetter(ch) || guessed.includes(normalizeLetter(ch)) ? ch : '_')).join('');
}

export function songSolved(title: string, guessed: string[]): boolean {
  return [...title].every((ch) => !isLetter(ch) || guessed.includes(normalizeLetter(ch)));
}

export function wrongGuesses(title: string, guessed: string[]): number {
  const letters = new Set([...title].filter(isLetter).map(normalizeLetter));
  return guessed.filter((g) => !letters.has(g)).length;
}

// ---------- Café de Mochi ----------
export const CAFE_MENU = [
  { id: 'cafe', emoji: '☕', name: 'Café' },
  { id: 'te', emoji: '🍵', name: 'Té' },
  { id: 'boba', emoji: '🧋', name: 'Bubble tea' },
  { id: 'torta', emoji: '🍰', name: 'Torta' },
  { id: 'gallet', emoji: '🍪', name: 'Galletita' },
  { id: 'onigiri', emoji: '🍙', name: 'Onigiri' },
];
export const CAFE_SECONDS = 60;

export interface Order {
  member: string;
  emoji: string;
  items: string[]; // ids del menú, en cualquier orden
}

export function newOrder(rng: Rng = Math.random, level = 0): Order {
  const m = pick(MEMBERS, rng);
  const n = Math.min(4, 1 + Math.floor(rng() * 2) + Math.floor(level / 3));
  return { member: m.name, emoji: m.emoji, items: Array.from({ length: n }, () => pick(CAFE_MENU, rng).id) };
}

/** Compara la bandeja con el pedido sin importar el orden. */
export function trayMatches(order: Order, tray: string[]): boolean {
  if (order.items.length !== tray.length) return false;
  const a = [...order.items].sort().join();
  return a === [...tray].sort().join();
}

/** ¿La bandeja todavía puede convertirse en el pedido? */
export function trayOnTrack(order: Order, tray: string[]): boolean {
  const left = [...order.items];
  for (const t of tray) {
    const i = left.indexOf(t);
    if (i < 0) return false;
    left.splice(i, 1);
  }
  return true;
}

// ---------- ¿Dónde está el gatito? (vasos) ----------
export type Swap = [number, number];
export function cupSwaps(rng: Rng = Math.random, n = 6, cups = 3): Swap[] {
  return Array.from({ length: n }, () => {
    const a = Math.floor(rng() * cups);
    const b = (a + 1 + Math.floor(rng() * (cups - 1))) % cups;
    return [a, b] as Swap;
  });
}

/** Sigue la posición del gatito a través de los intercambios. */
export function followCup(start: number, swaps: Swap[]): number {
  return swaps.reduce((pos, [a, b]) => (pos === a ? b : pos === b ? a : pos), start);
}

// ---------- Tres en raya ----------
export type Cell = 'X' | 'O' | null;
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function winner(b: Cell[]): 'X' | 'O' | 'empate' | null {
  for (const [a, c, d] of LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  return b.every(Boolean) ? 'empate' : null;
}

/** Jugada del gatito (O): gana si puede, bloquea si debe, si no centro/esquinas. A veces se distrae. */
export function catMove(b: Cell[], rng: Rng = Math.random, mistakes = 0.2): number {
  const free = b.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
  const tryFor = (p: 'X' | 'O') =>
    free.find((i) => {
      const n = [...b];
      n[i] = p;
      return winner(n) === p;
    });
  const win = tryFor('O');
  if (win !== undefined) return win;
  const block = tryFor('X');
  if (block !== undefined && rng() >= mistakes) return block;
  if (b[4] === null && rng() >= mistakes) return 4;
  const corners = free.filter((i) => [0, 2, 6, 8].includes(i));
  return pick(corners.length && rng() >= mistakes ? corners : free, rng);
}

// ---------- Burbujas Borahae ----------
export const BUBBLES_SECONDS = 30;
export interface Bubble {
  id: number;
  x: number; // 0..1
  born: number; // segundo
  speed: number; // alto por segundo, hacia arriba
  size: number; // px
  kind: 'morada' | 'dorada' | 'nube';
}

export function spawnBubble(id: number, t: number, rng: Rng = Math.random): Bubble {
  const r = rng();
  const kind = r < 0.1 ? 'dorada' : r < 0.25 ? 'nube' : 'morada';
  return { id, x: 0.1 + rng() * 0.8, born: t, speed: 0.18 + rng() * 0.12 + t / 300, size: 48 + Math.floor(rng() * 26), kind };
}

export const bubblePoints = (b: Bubble) => (b.kind === 'dorada' ? 5 : b.kind === 'nube' ? -2 : 1);
export const bubbleY = (b: Bubble, t: number) => 1.1 - (t - b.born) * b.speed;
