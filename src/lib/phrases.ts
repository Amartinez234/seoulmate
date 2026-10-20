// Frases originales escritas para la app (no son letras de canciones ni citas de series).
import { daysBetweenKeys, todayKey } from './dates';

export const PHRASES: string[] = [
  'Hoy también mereces cosas lindas. 화이팅!',
  'Las estrellas no compiten: cada una brilla a su manera.',
  'Un capítulo nuevo empieza cada mañana.',
  'Tomate un café tranquilo y empezá despacito.',
  'Tu risa es la banda sonora favorita de alguien.',
  'Los días grises también tienen su encanto, como la lluvia en un café.',
  'Si hoy cuesta, hacé solo el próximo paso pequeño.',
  'Hay un gatito que te espera con un ronroneo.',
  'Guardá un momento bonito de hoy en tu diario.',
  'Sos la protagonista de tu propia historia.',
  'Respirá hondo: lo estás haciendo mejor de lo que creés.',
  'Que hoy te encuentre una canción que te abrace.',
  'Las flores de cerezo duran poco, por eso las miramos con calma.',
  'Un mensaje lindo puede cambiar el día entero.',
  'Bajo la misma luna, alguien está pensando en vos.',
  'Pequeñas alegrías, grandes días.',
  'Hoy es buen día para un episodio más… o un descanso.',
  'Tu corazón tiene derecho a ir a su ritmo.',
  'Las mejores escenas no siempre tienen música de fondo.',
  'Brillás incluso cuando no te das cuenta.',
  'Un paso, una taza de té, un suspiro. Ya está.',
  'Lo que sembrás con cariño, florece.',
  'Hoy podés ser suave con vos misma.',
  'Que el día tenga color lavanda.',
  'Mirá por la ventana: algo lindo siempre está pasando.',
  'Tu energía bonita se contagia.',
  'Está bien pausar la historia para mirar el paisaje.',
  'Sos motivo de muchas sonrisas.',
  'La constancia también es una forma de magia.',
  'Que tu día tenga final feliz.',
  'Te mereces todo el amor que das. 사랑해 💜',
];

export function phraseOfDay(now = new Date(), custom: string[] = []): string {
  const pool = [...PHRASES, ...custom.filter((p) => p.trim())];
  const idx = daysBetweenKeys('2024-01-01', todayKey(now));
  return pool[((idx % pool.length) + pool.length) % pool.length];
}
