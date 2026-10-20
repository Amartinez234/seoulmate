import { describe, expect, it } from 'vitest';
import {
  adopt, applyAction, buyItem, claimMission, claimVisit, COOLDOWN_MS, DAILY_ACTION_HEART_CAP, initialPet, levelInfo,
  missionDone, rewardTask, tick, toggleEquip,
} from '../../src/lib/pet';

const T0 = new Date(2026, 9, 16, 10, 0, 0).getTime();
const H = 3_600_000;

function adopted() {
  return adopt(initialPet(T0), 'Mochi', 'crema', T0);
}

describe('gatito', () => {
  it('exige nombre válido al adoptar', () => {
    expect(() => adopt(initialPet(T0), '  ', 'gris')).toThrow();
    expect(adopted().name).toBe('Mochi');
  });

  it('alimentar sube energía y da corazones', () => {
    const s = adopted();
    const { state, outcome } = applyAction(s, 'feed', T0);
    expect(outcome.ok).toBe(true);
    expect(outcome.reaction).toBe('eat');
    expect(state.stats.energy).toBe(95);
    expect(state.hearts).toBe(s.hearts + 2);
    expect(state.today.feed).toBe(1);
  });

  it('respeta la espera entre acciones repetidas', () => {
    const a = applyAction(adopted(), 'feed', T0).state;
    const b = applyAction({ ...a, stats: { ...a.stats, energy: 10 } }, 'feed', T0 + 1000);
    expect(b.outcome.ok).toBe(false);
    expect(b.outcome.reaction).toBe('wait');
    const c = applyAction({ ...a, stats: { ...a.stats, energy: 10 } }, 'feed', T0 + COOLDOWN_MS.feed + 1);
    expect(c.outcome.ok).toBe(true);
  });

  it('no juega si está muy cansado, y no come si está lleno', () => {
    const s = adopted();
    const tired = applyAction({ ...s, stats: { ...s.stats, energy: 10 } }, 'play', T0);
    expect(tired.outcome.reaction).toBe('tired');
    expect(tired.state.stats.happiness).toBe(s.stats.happiness);
    const full = applyAction({ ...s, stats: { ...s.stats, energy: 98 } }, 'feed', T0);
    expect(full.outcome.reaction).toBe('full');
  });

  it('jugar sube felicidad (más con juguete) y gasta energía', () => {
    const s = adopted();
    const a = applyAction(s, 'play', T0).state;
    expect(a.stats.happiness).toBe(85);
    expect(a.stats.energy).toBe(60);
    const withToy = { ...s, owned: [...s.owned, 'ovillo'], equipped: { ...s.equipped, toy: 'ovillo' } };
    expect(applyAction(withToy, 'play', T0).state.stats.happiness).toBe(90);
  });

  it('acariciar sube el cariño', () => {
    const a = applyAction(adopted(), 'pet', T0).state;
    expect(a.stats.affection).toBe(26);
  });

  it('limita los corazones diarios por acciones', () => {
    let s = adopted();
    let t = T0;
    for (let i = 0; i < 60; i++) {
      t += COOLDOWN_MS.pet + 1;
      s = applyAction(s, 'pet', t).state;
    }
    expect(s.today.heartsFromActions).toBe(DAILY_ACTION_HEART_CAP);
  });

  it('no castiga la ausencia: tras 30 días vuelve a la calma y el cariño se mantiene', () => {
    const s = { ...adopted(), stats: { affection: 90, energy: 10, happiness: 100 } };
    const later = tick(s, T0 + 30 * 24 * H);
    expect(later.stats.affection).toBe(90);
    expect(later.stats.energy).toBe(60);
    expect(later.stats.happiness).toBe(60);
  });

  it('visita diaria: una vez por día, regalo de bienvenida tras días sin entrar', () => {
    const s = adopted();
    const v1 = claimVisit(s, T0);
    expect(v1.hearts).toBe(10);
    expect(claimVisit(v1.state, T0 + H).hearts).toBe(0);
    const v2 = claimVisit(v1.state, T0 + 5 * 24 * H);
    expect(v2.hearts).toBe(25);
    expect(v2.message).toMatch(/extrañé/);
  });

  it('misiones del día solo se reclaman completas y una vez', () => {
    let s = adopted();
    expect(() => claimMission(s, 'comida', { wroteDiaryToday: false }, T0)).toThrow(/Todavía/);
    s = applyAction(s, 'feed', T0).state;
    expect(missionDone(s, 'comida', { wroteDiaryToday: false })).toBe(true);
    const c = claimMission(s, 'comida', { wroteDiaryToday: false }, T0);
    expect(c.hearts).toBe(s.hearts + 3);
    expect(() => claimMission(c, 'comida', { wroteDiaryToday: false }, T0)).toThrow(/Ya reclamaste/);
    expect(claimMission(c, 'diario', { wroteDiaryToday: true }, T0).hearts).toBe(c.hearts + 8);
  });

  it('recompensa por tarea solo una vez', () => {
    const r1 = rewardTask(adopted(), 't1');
    expect(r1.hearts).toBe(5);
    expect(rewardTask(r1.state, 't1').hearts).toBe(0);
  });

  it('tienda: corazones, nivel, compra y colocar objetos', () => {
    const s = { ...adopted(), hearts: 100 };
    expect(() => buyItem({ ...s, hearts: 5 }, 'planta')).toThrow(/faltan/);
    expect(() => buyItem(s, 'corona-estrellas')).toThrow(/nivel 3/);
    const b = buyItem(s, 'planta');
    expect(b.hearts).toBe(88);
    expect(() => buyItem(b, 'planta')).toThrow(/Ya lo/);
    expect(() => toggleEquip(b, 'guirnalda')).toThrow(/desbloquearlo/);
    const e = toggleEquip(b, 'planta');
    expect(e.equipped.decor).toEqual(['planta']);
    expect(toggleEquip(e, 'planta').equipped.decor).toEqual([]);
    const w = toggleEquip(b, 'pared-crema');
    expect(w.equipped.wallpaper).toBe('pared-crema');
  });

  it('niveles', () => {
    expect(levelInfo(0)).toEqual({ level: 1, into: 0, need: 60 });
    expect(levelInfo(60).level).toBe(2);
    expect(levelInfo(160).level).toBe(3);
  });
});
