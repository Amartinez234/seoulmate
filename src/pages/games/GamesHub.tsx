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
const RhythmGame = lazy(() => import('./RhythmGame').then((m) => ({ default: m.RhythmGame })));
const SimonGame = lazy(() => import('./SimonGame').then((m) => ({ default: m.SimonGame })));
const HopperGame = lazy(() => import('./HopperGame').then((m) => ({ default: m.HopperGame })));
const WhoGame = lazy(() => import('./WhoGame').then((m) => ({ default: m.WhoGame })));
const TimelineGame = lazy(() => import('./TimelineGame').then((m) => ({ default: m.TimelineGame })));
const WordSearchGame = lazy(() => import('./WordSearchGame').then((m) => ({ default: m.WordSearchGame })));
const SongGame = lazy(() => import('./SongGame').then((m) => ({ default: m.SongGame })));
const BubblesGame = lazy(() => import('./BubblesGame').then((m) => ({ default: m.BubblesGame })));
const CafeGame = lazy(() => import('./CafeGame').then((m) => ({ default: m.CafeGame })));
const CupsGame = lazy(() => import('./CupsGame').then((m) => ({ default: m.CupsGame })));
const TicTacToeGame = lazy(() => import('./TicTacToeGame').then((m) => ({ default: m.TicTacToeGame })));

type Open = GameId | 'hablar' | null;

type GameDef = { id: Exclude<Open, null>; title: string; emoji: string; text: string; tone: string };

const SECTIONS: Array<{ title: string; games: GameDef[] }> = [
  {
    title: 'Con tu gatito',
    games: [
      { id: 'hablar', title: 'Hablá con tu gatito', emoji: '🎙️', text: 'Decile algo y te lo repite con vocecita.', tone: 'g-rose' },
      { id: 'cafe', title: 'Café de Mochi', emoji: '☕', text: 'Atendé los pedidos de los 7.', tone: 'g-butter' },
      { id: 'saltarin', title: 'Gatito saltarín', emoji: '🐾', text: 'Corré al concierto saltando obstáculos.', tone: 'g-mint' },
      { id: 'vasos', title: '¿Dónde está el gatito?', emoji: '🧋', text: 'Seguilo entre los vasos de bubble tea.', tone: 'g-violet' },
      { id: 'tateti', title: 'Tres en raya', emoji: '⭕', text: 'Jugá contra tu gatito.', tone: 'g-rose' },
    ],
  },
  {
    title: 'Música y baile',
    games: [
      { id: 'ritmo', title: 'Ritmo Bangtan', emoji: '🎶', text: 'Tocá las notas a tiempo.', tone: 'g-night' },
      { id: 'coreo', title: 'Coreografía', emoji: '💃', text: 'Repetí los pasos en orden.', tone: 'g-violet' },
      { id: 'luces', title: 'Concierto morado', emoji: '🎤', text: 'Encendé el mar de luces del estadio.', tone: 'g-night' },
      { id: 'atrapar', title: 'Lluvia morada', emoji: '💜', text: 'Atrapá corazones y a los 7.', tone: 'g-violet' },
      { id: 'burbujas', title: 'Burbujas Borahae', emoji: '🫧', text: 'Reventá las burbujas moradas.', tone: 'g-mint' },
    ],
  },
  {
    title: 'Para ARMY que sabe',
    games: [
      { id: 'quiz', title: 'Quiz ARMY', emoji: '🧠', text: '10 preguntas sobre BTS.', tone: 'g-mint' },
      { id: 'quien', title: '¿Quién es?', emoji: '🔎', text: 'Adiviná el integrante por la pista.', tone: 'g-butter' },
      { id: 'cancion', title: 'Adiviná la canción', emoji: '🎵', text: 'Descubrí el título letra por letra.', tone: 'g-rose' },
      { id: 'linea', title: 'Línea de tiempo', emoji: '💿', text: 'Ordená los álbumes por año.', tone: 'g-violet' },
      { id: 'sopa', title: 'Sopa ARMY', emoji: '🔤', text: 'Encontrá a los 7 en la sopa de letras.', tone: 'g-butter' },
      { id: 'memoria', title: 'Memoria de los 7', emoji: '🐰', text: 'Encontrá las parejas de cada integrante.', tone: 'g-rose' },
    ],
  },
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
      {SECTIONS.map((sec) => (
        <section key={sec.title} className="games-section">
          <h3>{sec.title}</h3>
          <div className="games-grid">
            {sec.games.map((g) => (
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
        </section>
      ))}
      <Suspense fallback={null}>
        {open === 'atrapar' && <CatchGame onClose={close} />}
        {open === 'memoria' && <MemoryGame onClose={close} />}
        {open === 'luces' && <LightsGame onClose={close} />}
        {open === 'quiz' && <QuizGame onClose={close} />}
        {open === 'hablar' && <TalkingCat onClose={close} />}
        {open === 'ritmo' && <RhythmGame onClose={close} />}
        {open === 'coreo' && <SimonGame onClose={close} />}
        {open === 'saltarin' && <HopperGame onClose={close} />}
        {open === 'quien' && <WhoGame onClose={close} />}
        {open === 'linea' && <TimelineGame onClose={close} />}
        {open === 'sopa' && <WordSearchGame onClose={close} />}
        {open === 'cancion' && <SongGame onClose={close} />}
        {open === 'burbujas' && <BubblesGame onClose={close} />}
        {open === 'cafe' && <CafeGame onClose={close} />}
        {open === 'vasos' && <CupsGame onClose={close} />}
        {open === 'tateti' && <TicTacToeGame onClose={close} />}
      </Suspense>
    </div>
  );
}
