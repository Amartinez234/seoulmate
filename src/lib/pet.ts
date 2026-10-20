// Lógica pura del gatito virtual. Sin castigos: si pasan días sin entrar, las estadísticas
// solo vuelven suavemente a un punto de calma y el cariño nunca baja.
import { daysBetweenKeys, todayKey } from './dates';

export type Breed = 'crema' | 'gris' | 'esmoquin' | 'naranja';
export type PetAction = 'feed' | 'play' | 'pet';
export type Reaction = 'eat' | 'play' | 'pet' | 'tired' | 'full' | 'wait' | 'gift';
export type ItemKind = 'accessory' | 'toy' | 'bed' | 'decor' | 'wallpaper';

export interface PetStats {
  affection: number;
  energy: number;
  happiness: number;
}

export interface PetState {
  adopted: boolean;
  name: string;
  breed: Breed;
  stats: PetStats;
  xp: number;
  hearts: number;
  owned: string[];
  equipped: { accessory: string | null; toy: string | null; bed: string | null; decor: string[]; wallpaper: string };
  lastTick: number;
  lastAction: Partial<Record<PetAction, number>>;
  today: { day: string; feed: number; play: number; pet: number; heartsFromActions: number; missionsClaimed: string[]; heartsFromGames?: number };
  visits: { lastDay: string | null; totalDays: number };
  rewardedTasks: string[];
  best?: Partial<Record<GameId, number>>; // récords de los minijuegos
}

export const BREEDS: Array<{ id: Breed; label: string }> = [
  { id: 'crema', label: 'Crema' },
  { id: 'gris', label: 'Gris perla' },
  { id: 'esmoquin', label: 'Esmoquin' },
  { id: 'naranja', label: 'Atigrado naranja' },
];

export const COOLDOWN_MS: Record<PetAction, number> = { feed: 20_000, play: 8_000, pet: 1_500 };
export const DAILY_ACTION_HEART_CAP = 30;
export const BASELINE = 60;
export const DRIFT_PER_HOUR = 3;
const MAX_DECOR = 3;

export interface ShopItem {
  id: string;
  name: string;
  kind: ItemKind;
  cost: number;
  minLevel: number;
}

export const SHOP: ShopItem[] = [
  { id: 'lazo-rosa', name: 'Lazo rosa', kind: 'accessory', cost: 15, minLevel: 1 },
  { id: 'flor-cerezo', name: 'Flor de cerezo', kind: 'accessory', cost: 20, minLevel: 1 },
  { id: 'bufanda-lavanda', name: 'Bufanda lavanda', kind: 'accessory', cost: 25, minLevel: 1 },
  { id: 'gafas-corazon', name: 'Gafas de corazón', kind: 'accessory', cost: 30, minLevel: 2 },
  { id: 'auriculares', name: 'Auriculares', kind: 'accessory', cost: 45, minLevel: 2 },
  { id: 'corona-estrellas', name: 'Corona de estrellas', kind: 'accessory', cost: 60, minLevel: 3 },
  { id: 'ovillo', name: 'Ovillo de lana', kind: 'toy', cost: 10, minLevel: 1 },
  { id: 'raton', name: 'Ratoncito de tela', kind: 'toy', cost: 15, minLevel: 1 },
  { id: 'varita-pluma', name: 'Varita con pluma', kind: 'toy', cost: 25, minLevel: 2 },
  { id: 'pelota-estrella', name: 'Pelota estrella', kind: 'toy', cost: 35, minLevel: 2 },
  { id: 'cojin-nube', name: 'Cojín nube', kind: 'bed', cost: 20, minLevel: 1 },
  { id: 'cesta', name: 'Cesta tejida', kind: 'bed', cost: 30, minLevel: 2 },
  { id: 'cama-luna', name: 'Cama luna', kind: 'bed', cost: 60, minLevel: 3 },
  { id: 'planta', name: 'Plantita', kind: 'decor', cost: 12, minLevel: 1 },
  { id: 'cuadro-estrellas', name: 'Cuadro de estrellas', kind: 'decor', cost: 20, minLevel: 1 },
  { id: 'guirnalda', name: 'Guirnalda de luces', kind: 'decor', cost: 25, minLevel: 1 },
  { id: 'estante', name: 'Estante de recuerdos', kind: 'decor', cost: 30, minLevel: 2 },
  { id: 'lampara-luna', name: 'Lámpara luna', kind: 'decor', cost: 35, minLevel: 2 },
  { id: 'cerezo', name: 'Cerezo en maceta', kind: 'decor', cost: 40, minLevel: 3 },
  { id: 'pared-crema', name: 'Pared crema', kind: 'wallpaper', cost: 0, minLevel: 1 },
  { id: 'pared-lavanda', name: 'Pared lavanda', kind: 'wallpaper', cost: 0, minLevel: 1 },
  { id: 'pared-rosa', name: 'Pared rosa empolvado', kind: 'wallpaper', cost: 15, minLevel: 1 },
  { id: 'pared-cerezo', name: 'Pared de cerezos', kind: 'wallpaper', cost: 30, minLevel: 2 },
  { id: 'pared-noche', name: 'Noche estrellada', kind: 'wallpaper', cost: 40, minLevel: 2 },
];

export const MISSIONS = [
  { id: 'mimos', label: 'Hacerle 3 mimos', reward: 5 },
  { id: 'juego', label: 'Jugar una vez', reward: 5 },
  { id: 'comida', label: 'Darle de comer', reward: 3 },
  { id: 'diario', label: 'Escribir en tu diario hoy', reward: 8 },
] as const;
export type MissionId = (typeof MISSIONS)[number]['id'];

export function initialPet(now = Date.now()): PetState {
  return {
    adopted: false,
    name: '',
    breed: 'crema',
    stats: { affection: 20, energy: 70, happiness: 70 },
    xp: 0,
    hearts: 20,
    owned: ['pared-crema', 'pared-lavanda'],
    equipped: { accessory: null, toy: null, bed: null, decor: [], wallpaper: 'pared-lavanda' },
    lastTick: now,
    lastAction: {},
    today: { day: todayKey(new Date(now)), feed: 0, play: 0, pet: 0, heartsFromActions: 0, missionsClaimed: [] },
    visits: { lastDay: null, totalDays: 0 },
    rewardedTasks: [],
  };
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function levelInfo(xp: number): { level: number; into: number; need: number } {
  let level = 1;
  let need = 60;
  let rest = xp;
  while (rest >= need) {
    rest -= need;
    level++;
    need += 40;
  }
  return { level, into: rest, need };
}

export function adopt(state: PetState, name: string, breed: Breed, now = Date.now()): PetState {
  const clean = name.trim();
  if (!clean) throw new Error('Ponele un nombre a tu gatito.');
  if (clean.length > 24) throw new Error('El nombre puede tener hasta 24 caracteres.');
  return { ...state, adopted: true, name: clean, breed, lastTick: now };
}

function rollDay(state: PetState, now: number): PetState {
  const day = todayKey(new Date(now));
  if (state.today.day === day) return state;
  return { ...state, today: { day, feed: 0, play: 0, pet: 0, heartsFromActions: 0, missionsClaimed: [] } };
}

/** Deriva suave hacia la calma (60). Energía y felicidad nunca caen por debajo de ese punto por ausencia. */
export function tick(state: PetState, now = Date.now()): PetState {
  const hours = Math.max(0, (now - state.lastTick) / 3_600_000);
  const toward = (v: number) => {
    const step = hours * DRIFT_PER_HOUR;
    if (v > BASELINE) return Math.max(BASELINE, v - step);
    return Math.min(BASELINE, v + step);
  };
  const s = rollDay(state, now);
  if (hours < 0.01) return s;
  return {
    ...s,
    lastTick: now,
    stats: { affection: s.stats.affection, energy: clamp(toward(s.stats.energy)), happiness: clamp(toward(s.stats.happiness)) },
  };
}

export interface ActionOutcome {
  ok: boolean;
  reaction: Reaction;
  message: string;
  heartsEarned: number;
}

export function cooldownLeft(state: PetState, action: PetAction, now = Date.now()): number {
  const last = state.lastAction[action];
  if (!last) return 0;
  return Math.max(0, last + COOLDOWN_MS[action] - now);
}

export function applyAction(state: PetState, action: PetAction, now = Date.now()): { state: PetState; outcome: ActionOutcome } {
  let s = tick(state, now);
  const name = s.name || 'Tu gatito';
  const left = cooldownLeft(s, action, now);
  if (left > 0) {
    return {
      state: s,
      outcome: { ok: false, reaction: 'wait', message: `${name} necesita ${Math.ceil(left / 1000)} s antes de repetir.`, heartsEarned: 0 },
    };
  }
  const st = { ...s.stats };
  let xp = 0;
  let hearts = 0;
  let reaction: Reaction;
  let message: string;
  if (action === 'feed') {
    if (st.energy >= 95) {
      return { state: s, outcome: { ok: false, reaction: 'full', message: `${name} está llenito. ¡Gracias!`, heartsEarned: 0 } };
    }
    st.energy = clamp(st.energy + 25);
    st.happiness = clamp(st.happiness + 5);
    st.affection = clamp(st.affection + 2);
    xp = 5;
    hearts = 2;
    reaction = 'eat';
    message = `¡Ñam! ${name} disfrutó su comida.`;
  } else if (action === 'play') {
    if (st.energy < 15) {
      return {
        state: s,
        outcome: { ok: false, reaction: 'tired', message: `${name} tiene sueño. Dale de comer o dejalo descansar un rato.`, heartsEarned: 0 },
      };
    }
    const toyBonus = s.equipped.toy ? 5 : 0;
    st.happiness = clamp(st.happiness + 15 + toyBonus);
    st.energy = clamp(st.energy - 10);
    st.affection = clamp(st.affection + 3);
    xp = 8;
    hearts = 3;
    reaction = 'play';
    message = toyBonus ? `¡A ${name} le encanta su juguete!` : `${name} jugó feliz.`;
  } else {
    st.affection = clamp(st.affection + 6);
    st.happiness = clamp(st.happiness + 3);
    xp = 3;
    hearts = 1;
    reaction = 'pet';
    message = `${name} ronronea… prrr.`;
  }
  const allowed = Math.max(0, Math.min(hearts, DAILY_ACTION_HEART_CAP - s.today.heartsFromActions));
  s = {
    ...s,
    stats: st,
    xp: s.xp + xp,
    hearts: s.hearts + allowed,
    lastAction: { ...s.lastAction, [action]: now },
    today: { ...s.today, [action]: s.today[action] + 1, heartsFromActions: s.today.heartsFromActions + allowed },
  };
  return { state: s, outcome: { ok: true, reaction, message, heartsEarned: allowed } };
}

/** Recompensa por visitar: una vez por día, sin rachas que se pierdan. */
export function claimVisit(state: PetState, now = Date.now()): { state: PetState; hearts: number; message: string | null } {
  const s = tick(state, now);
  const day = todayKey(new Date(now));
  if (s.visits.lastDay === day) return { state: s, hearts: 0, message: null };
  const totalDays = s.visits.totalDays + 1;
  let hearts = 10;
  let message = '¡Gracias por visitar! +10 corazones';
  if (s.visits.lastDay && daysBetweenKeys(s.visits.lastDay, day) >= 3) {
    hearts += 15;
    message = `¡Te extrañé! Te guardé un regalito: +${hearts} corazones`;
  }
  if (totalDays % 7 === 0) {
    hearts += 20;
    message = `¡Visita número ${totalDays}! Regalo especial: +${hearts} corazones`;
  }
  return { state: { ...s, hearts: s.hearts + hearts, visits: { lastDay: day, totalDays } }, hearts, message };
}

export interface MissionContext {
  wroteDiaryToday: boolean;
}

export function missionDone(state: PetState, id: MissionId, ctx: MissionContext): boolean {
  switch (id) {
    case 'mimos':
      return state.today.pet >= 3;
    case 'juego':
      return state.today.play >= 1;
    case 'comida':
      return state.today.feed >= 1;
    case 'diario':
      return ctx.wroteDiaryToday;
  }
}

export function claimMission(state: PetState, id: MissionId, ctx: MissionContext, now = Date.now()): PetState {
  const s = rollDay(state, now);
  const m = MISSIONS.find((x) => x.id === id);
  if (!m) throw new Error('Misión desconocida');
  if (s.today.missionsClaimed.includes(id)) throw new Error('Ya reclamaste esta misión hoy.');
  if (!missionDone(s, id, ctx)) throw new Error('Todavía no completaste esta misión.');
  return { ...s, hearts: s.hearts + m.reward, today: { ...s.today, missionsClaimed: [...s.today.missionsClaimed, id] } };
}

export const TASK_REWARD = 5;
/** Recompensa (una sola vez por tarea) al completar una tarea personal. */
export function rewardTask(state: PetState, taskId: string): { state: PetState; hearts: number } {
  if (state.rewardedTasks.includes(taskId)) return { state, hearts: 0 };
  return { state: { ...state, hearts: state.hearts + TASK_REWARD, rewardedTasks: [...state.rewardedTasks, taskId] }, hearts: TASK_REWARD };
}

export function buyItem(state: PetState, itemId: string): PetState {
  const item = SHOP.find((i) => i.id === itemId);
  if (!item) throw new Error('Ese objeto no existe.');
  if (state.owned.includes(itemId)) throw new Error('Ya lo tenés.');
  const { level } = levelInfo(state.xp);
  if (level < item.minLevel) throw new Error(`Se desbloquea en el nivel ${item.minLevel}.`);
  if (state.hearts < item.cost) throw new Error(`Te faltan ${item.cost - state.hearts} corazones.`);
  return { ...state, hearts: state.hearts - item.cost, owned: [...state.owned, itemId] };
}

/** Coloca o quita un objeto. Devuelve el nuevo estado. */
export function toggleEquip(state: PetState, itemId: string): PetState {
  const item = SHOP.find((i) => i.id === itemId);
  if (!item) throw new Error('Ese objeto no existe.');
  if (!state.owned.includes(itemId)) throw new Error('Primero tenés que desbloquearlo.');
  const eq = { ...state.equipped, decor: [...state.equipped.decor] };
  switch (item.kind) {
    case 'wallpaper':
      eq.wallpaper = itemId;
      break;
    case 'decor':
      if (eq.decor.includes(itemId)) eq.decor = eq.decor.filter((d) => d !== itemId);
      else {
        if (eq.decor.length >= MAX_DECOR) throw new Error(`Podés poner hasta ${MAX_DECOR} decoraciones. Quitá una primero.`);
        eq.decor.push(itemId);
      }
      break;
    default:
      eq[item.kind] = eq[item.kind] === itemId ? null : itemId;
  }
  return { ...state, equipped: eq };
}

export function isEquipped(state: PetState, itemId: string): boolean {
  const e = state.equipped;
  return e.accessory === itemId || e.toy === itemId || e.bed === itemId || e.wallpaper === itemId || e.decor.includes(itemId);
}

export function moodOf(stats: PetStats): { label: string; emoji: string } {
  const avg = (stats.energy + stats.happiness + stats.affection) / 3;
  if (stats.energy < 30) return { label: 'con sueñito', emoji: '💤' };
  if (avg >= 80) return { label: 'radiante', emoji: '✨' };
  if (avg >= 60) return { label: 'feliz', emoji: '💜' };
  return { label: 'tranquilo', emoji: '🌙' };
}

// ---------- Minijuegos ----------
export type GameId =
  | 'atrapar' | 'memoria' | 'luces' | 'quiz'
  | 'ritmo' | 'coreo' | 'saltarin' | 'quien' | 'linea' | 'sopa' | 'cancion' | 'burbujas' | 'cafe' | 'vasos' | 'tateti';
export const DAILY_GAME_HEART_CAP = 60;
/** Cuántos puntos hacen falta por corazón en cada juego (máximo 15 corazones por partida). */
const POINTS_PER_HEART: Record<GameId, number> = {
  atrapar: 3, memoria: 8, luces: 2, quiz: 7,
  ritmo: 14, coreo: 8, saltarin: 6, quien: 6, linea: 7, sopa: 8, cancion: 6, burbujas: 4, cafe: 6, vasos: 4, tateti: 2,
};

export interface GameReward {
  state: PetState;
  hearts: number;
  newRecord: boolean;
  capped: boolean;
}

/** Premio al terminar una partida: corazones, XP y felicidad. Jugar cansa un poco, pero nunca por debajo de 15. */
export function rewardGame(state: PetState, game: GameId, score: number, now = Date.now()): GameReward {
  const s = tick(state, now);
  const pts = Math.max(0, Math.floor(score));
  const raw = pts > 0 ? Math.min(15, Math.max(1, Math.round(pts / POINTS_PER_HEART[game]))) : 0;
  const used = s.today.heartsFromGames ?? 0;
  const hearts = Math.max(0, Math.min(raw, DAILY_GAME_HEART_CAP - used));
  const prev = s.best?.[game] ?? 0;
  const newRecord = pts > prev;
  return {
    state: {
      ...s,
      hearts: s.hearts + hearts,
      xp: s.xp + Math.min(20, 4 + Math.floor(pts / 5)),
      stats: {
        ...s.stats,
        happiness: clamp(s.stats.happiness + (pts > 0 ? 10 : 4)),
        energy: Math.min(s.stats.energy, Math.max(15, s.stats.energy - 6)),
        affection: clamp(s.stats.affection + 2),
      },
      best: { ...s.best, [game]: Math.max(prev, pts) },
      today: { ...s.today, play: s.today.play + 1, heartsFromGames: used + hearts },
    },
    hearts,
    newRecord,
    capped: hearts < raw,
  };
}
