// Menú de minijuegos del Cat Café.
import { lazy, Suspense, useState } from 'react';
import type { GameId, PetState } from '../../lib/pet';
import { DAILY_GAME_HEART_CAP } from '../../lib/pet';
import './games.css';

const CatchGame = lazy(() => import('./CatchGame').then((m) => ({ default: m.CatchGame })));
const MemoryGame = lazy(() => import('./MemoryGame').then((m) => ({ default: m.MemoryGame })));
const LightsGame = lazy(() => import('./LightsGame').then((m) => ({ default: m.LightsGame })));
const QuizGame = lazy(() => import('./QuizGame').then((m) => ({ default: m.QuizGame })));
const TalkingCat = lazy(() => import('./TalkingCat').then((m) => ({ default: m.TalkingCat })));

type Open = GameId | 'hablar' | null;

const GAMES: Array<{ id: Exclude<Open, null>; title: string; emoji: string; text: string; tone: string }> = [
  { id: 'hablar', title: 'Hablá con tu gatito', emoji: '🎙️', text: 'Decile algo y te lo repite con vocecita.', tone: 'g-rose' },
  { id: 'atrapar', title: 'Lluvia morada', emoji: '💜', text: 'Atrapá corazones y a los 7.', tone: 'g-violet' },
  { id: 'memoria', title: 'Memoria de los 7', emoji: '🐰', text: 'Encontrá las parejas de cada integrante.', tone: 'g-butter' },
  { id: 'luces', title: 'Concierto morado', emoji: '🎤', text: 'Encendé el mar de luces del estadio.', tone: 'g-night' },
  { id: 'quiz', title: 'Quiz ARMY', emoji: '🧠', text: '10 preguntas: ¿cuánto sabés de BTS?', tone: 'g-mint' },
];

export function GamesHub({ pet }: { pet: PetState }) {
  const [open, setOpen] = useState<Open>(null);
  const close = () => setOpen(null);
  const left = Math.max(0, DAILY_GAME_HEART_CAP - (pet.today.heartsFromGames ?? 0));
  return (
    <div>
      <p className="small muted" style={{ margin: '0 0 10px' }}>
        Jugando ganás corazones para la tienda ({left} 💗 disponibles hoy) y {pet.name} se pone feliz.
      </p>
      <div className="games-grid">
        {GAMES.map((g) => (
          <button key={g.id} type="button" className={`game-card ${g.tone}`} onClick={() => setOpen(g.id)} aria-label={`Jugar ${g.title}`}>
            <span className="game-emoji" aria-hidden="true">
              {g.emoji}
            </span>
            <strong>{g.title}</strong>
            <span className="tiny">{g.text}</span>
            {g.id !== 'hablar' && pet.best?.[g.id] ? <span className="game-best">🏆 {pet.best[g.id]}</span> : null}
          </button>
        ))}
      </div>
      <Suspense fallback={null}>
        {open === 'atrapar' && <CatchGame onClose={close} />}
        {open === 'memoria' && <MemoryGame onClose={close} />}
        {open === 'luces' && <LightsGame onClose={close} />}
        {open === 'quiz' && <QuizGame onClose={close} />}
        {open === 'hablar' && <TalkingCat onClose={close} />}
      </Suspense>
    </div>
  );
}
