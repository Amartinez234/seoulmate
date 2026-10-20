import { describe, expect, it } from 'vitest';
import { CATCH_LINE, memoryDeck, memoryScore, moveCat, newCatch, quizRound, spawnLight, stepCatch } from '../../src/lib/games';
import { QUIZ_BANK } from '../../src/lib/quiz';
import { DAILY_GAME_HEART_CAP, initialPet, rewardGame } from '../../src/lib/pet';
import { filterStories, progressText, safeLink, isWattpad, type Story } from '../../src/lib/stories';

const seq = (...v: number[]) => {
  let i = 0;
  return () => v[i++ % v.length];
};

describe('minijuegos', () => {
  it('memoria: 8 parejas (7 integrantes + ARMY) y puntaje', () => {
    const d = memoryDeck(seq(0.3, 0.7, 0.1));
    expect(d).toHaveLength(16);
    expect(new Set(d.map((c) => c.face)).size).toBe(8);
    expect(memoryScore(8, 20)).toBe(100);
    expect(memoryScore(20, 20)).toBe(52);
    expect(memoryScore(200, 900)).toBe(10);
  });

  it('lluvia morada: atrapar suma, dejar caer resta vidas y termina', () => {
    let s = moveCat(newCatch(), 0.5);
    s = { ...s, items: [{ id: 1, x: 0.5, y: CATCH_LINE - 0.01, speed: 1, emoji: '💜', points: 1 }], nextSpawn: 99 };
    s = stepCatch(s, 0.05);
    expect(s.score).toBe(1);
    s = { ...s, items: [0, 1, 2].map((i) => ({ id: 10 + i, x: 0.05, y: 1.04, speed: 1, emoji: '💜', points: 1 })), catX: 0.9 };
    s = stepCatch(s, 0.05);
    expect(s.lives).toBe(0);
    expect(s.over).toBe(true);
  });

  it('concierto: no repite asiento ocupado', () => {
    const l = spawnLight([{ seat: 0, kind: 'luz', until: 9 }], 1, seq(0));
    expect(l?.seat).toBe(1);
  });

  it('quiz: banco válido y ronda con la respuesta correcta reubicada', () => {
    expect(QUIZ_BANK.length).toBeGreaterThanOrEqual(30);
    for (const q of QUIZ_BANK) {
      expect(q.options).toHaveLength(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(4);
    }
    const r = quizRound(QUIZ_BANK, seq(0.9, 0.2, 0.5, 0.1));
    expect(r).toHaveLength(10);
    for (const q of r) {
      const orig = QUIZ_BANK.find((x) => x.q === q.q)!;
      expect(q.options[q.answer]).toBe(orig.options[orig.answer]);
    }
  });

  it('premios: corazones con tope diario, récord y energía nunca baja de 15', () => {
    let p = { ...initialPet(0), adopted: true, name: 'Mochi' };
    p = { ...p, stats: { ...p.stats, energy: 16 } };
    const r = rewardGame(p, 'memoria', 100, 1000);
    expect(r.hearts).toBe(13);
    expect(r.newRecord).toBe(true);
    expect(r.state.stats.energy).toBe(15);
    expect(r.state.today.play).toBe(1);
    let s = r.state;
    for (let i = 0; i < 6; i++) s = rewardGame(s, 'luces', 100, 1000).state;
    expect(s.today.heartsFromGames).toBe(DAILY_GAME_HEART_CAP);
    expect(rewardGame(s, 'quiz', 50, 1000).newRecord).toBe(true);
    expect(rewardGame(s, 'memoria', 40, 1000).newRecord).toBe(false);
  });
});

describe('biblioteca BL', () => {
  const base: Story = { id: '1', title: 'A', author: 'x', link: '', ship: 'Taekook', tags: ['Fluff'], status: 'leyendo', chapter: 2, chapters: 10, rating: 0, favorite: false, notes: '', createdAt: 0, updatedAt: 1 };
  it('enlaces y filtros', () => {
    expect(safeLink('http://wattpad.com/x')).toBeNull();
    expect(safeLink('javascript:alert(1)')).toBeNull();
    expect(isWattpad('https://www.wattpad.com/story/1')).toBe(true);
    expect(isWattpad('https://evilwattpad.com/')).toBe(false);
    const list = [base, { ...base, id: '2', ship: 'Yoonmin', favorite: true, tags: [], updatedAt: 0 }];
    expect(filterStories(list, { q: '', status: 'todas', ship: '', favorites: false })[0].id).toBe('2');
    expect(filterStories(list, { q: 'fluff', status: 'todas', ship: '', favorites: false })).toHaveLength(1);
    expect(filterStories(list, { q: '', status: 'todas', ship: 'yoonmin', favorites: false })).toHaveLength(1);
    expect(progressText(base)).toBe('Cap. 2 de 10');
  });
});
