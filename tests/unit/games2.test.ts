import { describe, expect, it } from 'vitest';
import {
  catMove, clueRound, cupSwaps, followCup, isChronological, judgeTap, jump, lineCells, makeWordGrid, maskSong, matchWord, newHopper,
  newOrder, rhythmChart, songSolved, stepHopper, timelineHits, timelineRound, trayMatches, trayOnTrack, winner, wrongGuesses, type Cell,
} from '../../src/lib/games2';
import { ALBUMS, MEMBER_CLUES } from '../../src/lib/btsData';
import { MEMBERS } from '../../src/lib/bts';

describe('segunda tanda de minijuegos', () => {
  it('ritmo: partitura ordenada y juicio de tiempo', () => {
    const c = rhythmChart(() => 0.5, 10);
    expect(c.every((n, i) => i === 0 || n.t > c[i - 1].t)).toBe(true);
    expect(judgeTap(0.05)).toBe(3);
    expect(judgeTap(-0.15)).toBe(1);
    expect(judgeTap(0.4)).toBe(0);
  });

  it('saltarín: salta, cae y choca con un obstáculo', () => {
    let s = jump(newHopper());
    expect(s.vy).toBeGreaterThan(0);
    for (let i = 0; i < 60; i++) s = stepHopper(s, 1 / 60, () => 0.99);
    expect(s.y).toBeGreaterThanOrEqual(0);
    let g = { ...newHopper(), next: 99, obstacles: [{ id: 1, x: 0.16, w: 0.07, h: 0.12, kind: '📦' }] };
    g = stepHopper(g, 0.01);
    expect(g.over).toBe(true);
  });

  it('¿quién es?: la respuesta coincide con la pista', () => {
    const r = clueRound(Math.random, 8);
    expect(r).toHaveLength(8);
    for (const q of r) {
      const real = MEMBER_CLUES.find((c) => c.clue === q.clue)!.member;
      expect(q.options[q.answer]).toBe(real);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options.every((o) => MEMBERS.some((m) => m.name === o))).toBe(true);
    }
  });

  it('línea de tiempo: años únicos y conteo de aciertos', () => {
    expect(new Set(ALBUMS.map((a) => a.year)).size).toBe(ALBUMS.length);
    const r = timelineRound(Math.random, 5);
    const sorted = [...r].sort((a, b) => a.year - b.year);
    expect(isChronological(sorted)).toBe(true);
    expect(timelineHits(sorted)).toBe(5);
    expect(timelineHits([...sorted].reverse())).toBe(1);
  });

  it('sopa de letras: todas las palabras están y se encuentran en ambos sentidos', () => {
    for (let k = 0; k < 20; k++) {
      const g = makeWordGrid();
      for (const w of g.words) {
        expect(w.cells.map((i) => g.letters[i]).join('')).toBe(w.word);
        const line = lineCells(g.size, w.cells[0], w.cells[w.cells.length - 1])!;
        expect(matchWord(g, line)?.word).toBe(w.word);
        expect(matchWord(g, [...line].reverse())?.word).toBe(w.word);
      }
    }
    expect(lineCells(10, 0, 12)).toBeNull();
  });

  it('canción: máscara, aciertos y errores', () => {
    expect(maskSong('Spring Day', ['S', 'A'])).toBe('S_____ _a_');
    expect(songSolved('ON', ['O', 'N'])).toBe(true);
    expect(wrongGuesses('DNA', ['D', 'Z', 'Q'])).toBe(2);
    expect(maskSong('Blood Sweat & Tears', [])).toContain('&');
  });

  it('café: pedidos en cualquier orden', () => {
    const o = { member: 'Jin', emoji: '🐹', items: ['cafe', 'torta', 'cafe'] };
    expect(trayMatches(o, ['torta', 'cafe', 'cafe'])).toBe(true);
    expect(trayOnTrack(o, ['cafe', 'cafe'])).toBe(true);
    expect(trayOnTrack(o, ['te'])).toBe(false);
    expect(newOrder(() => 0.5).items.length).toBeGreaterThan(0);
  });

  it('vasos: seguir al gatito entre intercambios', () => {
    expect(followCup(0, [[0, 1], [1, 2]])).toBe(2);
    expect(cupSwaps(Math.random, 10).every(([a, b]) => a !== b)).toBe(true);
  });

  it('tres en raya: detecta ganador y el gatito gana o bloquea', () => {
    const b: Cell[] = ['X', 'X', null, null, 'O', null, null, null, null];
    expect(catMove(b, () => 0.9, 0)).toBe(2);
    const w: Cell[] = ['O', 'O', null, 'X', 'X', null, null, null, null];
    expect(catMove(w, () => 0.9, 0)).toBe(2);
    expect(winner(['X', 'X', 'X', null, null, null, null, null, null])).toBe('X');
    expect(winner(['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'])).toBe('empate');
  });
});
