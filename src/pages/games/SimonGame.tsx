// Coreografía: los integrantes marcan pasos y hay que repetirlos en el mismo orden (Simón dice).
import { useEffect, useRef, useState } from 'react';
import { extendSequence } from '../../lib/games2';
import { useBeep } from './sound';
import { GameIntro, GameResult, GameShell } from './GameShell';

const PADS = [
  { emoji: '🐥', name: 'Jimin', tone: 392, cls: 'pad-rose' },
  { emoji: '🐰', name: 'Jung Kook', tone: 494, cls: 'pad-violet' },
  { emoji: '🐿️', name: 'j-hope', tone: 587, cls: 'pad-butter' },
  { emoji: '🐯', name: 'V', tone: 698, cls: 'pad-mint' },
];

export function SimonGame({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<'intro' | 'show' | 'input' | 'over'>('intro');
  const [seq, setSeq] = useState<number[]>([]);
  const [pos, setPos] = useState(0);
  const [lit, setLit] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const timers = useRef<number[]>([]);
  const beep = useBeep();
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const flashPad = (i: number, ms: number) => {
    setLit(i);
    beep.play(PADS[i].tone, ms / 1000);
    later(() => setLit(null), ms);
  };

  const show = (s: number[]) => {
    setPhase('show');
    const step = Math.max(320, 650 - s.length * 25);
    s.forEach((p, k) => later(() => flashPad(p, step * 0.7), 500 + k * step));
    later(() => {
      setPos(0);
      setPhase('input');
    }, 500 + s.length * step);
  };

  const start = () => {
    beep.init();
    const s = extendSequence([]);
    setSeq(s);
    setRound((r) => r + 1);
    show(s);
  };

  const tap = (i: number) => {
    if (phase !== 'input') return;
    flashPad(i, 220);
    if (seq[pos] !== i) {
      setPhase('over');
      return;
    }
    if (pos + 1 === seq.length) {
      const s = extendSequence(seq);
      setSeq(s);
      setPhase('show');
      later(() => show(s), 450);
    } else setPos(pos + 1);
  };

  const level = Math.max(0, seq.length - 1);
  return (
    <GameShell title="Coreografía" onClose={onClose} score={`Nivel ${phase === 'intro' ? 0 : seq.length}`}>
      <p className="small muted center" style={{ margin: '4px 0 12px' }} aria-live="polite">
        {phase === 'show' ? 'Mirá la coreo…' : phase === 'input' ? `¡Tu turno! Paso ${pos + 1} de ${seq.length}` : ' '}
      </p>
      <div className="simon">
        {PADS.map((p, i) => (
          <button
            key={i}
            type="button"
            className={`simon-pad ${p.cls} ${lit === i ? 'lit' : ''}`}
            onPointerDown={() => tap(i)}
            aria-label={p.name}
            data-testid="simon-pad"
            disabled={phase !== 'input'}
          >
            <span>{p.emoji}</span>
            <small>{p.name}</small>
          </button>
        ))}
      </div>
      {phase === 'intro' && (
        <GameIntro title="Coreografía 💃" onStart={start}>
          Cuatro integrantes marcan los pasos de la coreo. Mirá el orden en que se iluminan y repetilo tocándolos. Cada ronda suma un paso más.
        </GameIntro>
      )}
      {phase === 'over' && (
        <div className="game-overlay">
          <GameResult key={round} game="coreo" score={level * 10} detail={`Llegaste a ${level} ${level === 1 ? 'paso' : 'pasos'} seguidos.`} onAgain={start} onClose={onClose} />
        </div>
      )}
    </GameShell>
  );
}
