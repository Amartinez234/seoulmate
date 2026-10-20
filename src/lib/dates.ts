// Fechas en hora local, guardadas como 'YYYY-MM-DD'.
const pad = (n: number) => String(n).padStart(2, '0');

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isValidDateKey(s: unknown): s is string {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function parseDateKey(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function daysBetweenKeys(a: string, b: string): number {
  const ms = Date.UTC(...ymd(b)) - Date.UTC(...ymd(a));
  return Math.round(ms / 86_400_000);
}

function ymd(s: string): [number, number, number] {
  const [y, m, d] = s.split('-').map(Number);
  return [y, m - 1, d];
}

/** Sin fecha = siempre disponible. Con fecha = disponible desde ese día (inclusive). */
export function isUnlocked(dateKey: string | null | undefined, now = new Date()): boolean {
  if (!dateKey) return true;
  return todayKey(now) >= dateKey;
}

export function countdownText(dateKey: string, now = new Date()): string {
  const n = daysBetweenKeys(todayKey(now), dateKey);
  if (n <= 0) return 'disponible';
  if (n === 1) return 'mañana';
  return `en ${n} días`;
}

export interface Together {
  years: number;
  months: number;
  days: number;
  totalDays: number;
}

export function togetherCounter(start: string | null, now = new Date()): Together | null {
  if (!start || !isValidDateKey(start)) return null;
  const today = todayKey(now);
  if (start > today) return null;
  const [sy, sm, sd] = ymd(start);
  const [ty, tm, td] = ymd(today);
  let years = ty - sy;
  let months = tm - sm;
  let days = td - sd;
  if (days < 0) {
    months -= 1;
    days += new Date(ty, tm, 0).getDate(); // días del mes anterior
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days, totalDays: daysBetweenKeys(start, today) };
}

/** Días hasta el próximo "mesiversario" (mismo día del mes que la fecha de inicio). */
export function daysToNextMonthiversary(start: string | null, now = new Date()): number | null {
  if (!start || !isValidDateKey(start) || start > todayKey(now)) return null;
  const sd = ymd(start)[2];
  const today = todayKey(now);
  const [ty, tm] = ymd(today);
  for (let i = 0; i < 3; i++) {
    const y = ty + Math.floor((tm + i) / 12);
    const m = (tm + i) % 12;
    const last = new Date(y, m + 1, 0).getDate();
    const key = `${y}-${pad(m + 1)}-${pad(Math.min(sd, last))}`;
    if (key > today) return daysBetweenKeys(today, key);
  }
  return null;
}

const longFmt = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortFmt = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' });

export function formatLong(d: Date): string {
  return longFmt.format(d);
}

export function formatKey(key: string | null | undefined): string {
  if (!key || !isValidDateKey(key)) return '';
  return shortFmt.format(parseDateKey(key));
}
