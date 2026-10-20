// Ritmo Bangtan: notas que bajan por 3 carriles; hay que tocarlas justo en la línea.
import { useRef, useState } from 'react';
import { useBeep } from './sound';
import { judgeTap, RHYTHM_GOOD, RHYTHM_SECONDS, rhythmChart, type Note } from '../../lib/games2';
import { GameIntro, GameResult, GameShell, useFrame } from './GameShell';

const LANES = [
  { emoji: '💜', tone: 523.25, cls: 'lane-a' },
  { emoji: '🎤', tone: 659.25, cls: 'lane-b' },
  { emoji: '🐾', tone: 783.99, cls: 'lane-c' },
];
const TRAVEL = 1.7; // segundos que tarda una nota en bajar
const LINE = 0.84;

export function RhythmGame({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<'intro' | 'play' | 'over'>('intro');
  const [round, setRound] = useState(0);
  const [t, setT] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(0);
  const [flash, setFlash] = useState<{ lane: number; text: string; id: number } | null>(null);
  const chart = useRef<Note[]>([]);
  const judged = useRef(new Set<number>());
  const time = useRef(0);
  const beep = useBeep();

  useFrame(
    phase === 'play',
    (dt) => {
      time.current += dt;
      for (const n of chart.current) {
        if (!judged.current.has(n.id) && time.current - n.t > RHYTHM_GOOD) {
          judged.current.add(n.id);
          setCombo(0);
        }
      }
      setT(time.current);
      if (time.current > RHYTHM_SECONDS + 1) setPhase('over');
    },
    [round],
  );

  const hit = (lane: number) => {
    if (phase !== 'play') return;
    const now = time.current;
    const cand = chart.current
      .filter((n) => n.lane === lane && !judged.current.has(n.id) && Math.abs(n.t - now) <= RHYTHM_GOOD)
      .sort((a, b) => Math.abs(a.t - now) - Math.abs(b.t - now))[0];
    const id = Date.now();
    if (!cand) {
      setFlash({ lane, text: '·', id });
      return;
    }
    judged.current.add(cand.id);
    const pts = judgeTap(now - cand.t);
    beep.play(LANES[lane].tone);
    setScore((s) => s + pts);
    setCombo((c) => {
      const n = c + 1;
      setBest((b) => Math.max(b, n));
      return n;
    });
    setFlash({ lane, text: pts === 3 ? '¡Perfecto!' : '¡Bien!', id });
  };

  const start = () => {
    beep.init();
    chart.current = rhythmChart();
    judged.current = new Set();
    time.current = 0;
    setT(0);
    setScore(0);
    setCombo(0);
    setBest(0);
    setPhase('play');
    setRound((r) => r + 1);
  };

  const visible = chart.current.filter((n) => !judged.current.has(n.id) && n.t - t < TRAVEL && n.t - t > -0.3);
  return (
    <GameShell title="Ritmo Bangtan" onClose={onClose} score={`${score} 💜 · combo ${combo}`}>
      <div className="rhythm" data-testid="rhythm">
        {LANES.map((l, i) => (
          <div key={i} className={`rh-lane ${l.cls}`}>
            {visible
              .filter((n) => n.lane === i)
              .map((n) => (
                <span key={n.id} className="rh-note" style={{ top: `${(LINE - (n.t - t) / TRAVEL) * 100}%` }}>
                  {l.emoji}
                </span>
              ))}
            {flash?.lane === i && (
              <span key={flash.id} className="rh-flash">
                {flash.text}
              </span>
            )}
          </div>
        ))}
        <div className="rh-line" style={{ top: `${LINE * 100}%` }} />
        <div className="rh-bar" style={{ width: `${Math.min(100, (t / RHYTHM_SECONDS) * 100)}%` }} />
      </div>
      <div className="rh-pads">
        {LANES.map((l, i) => (
          <button key={i} type="button" className={`rh-pad ${l.cls}`} onPointerDown={() => hit(i)} aria-label={`Carril ${i + 1}`} data-testid="rh-pad">
            {l.emoji}
          </button>
        ))}
      </div>
      {phase === 'intro' && (
        <GameIntro title="Ritmo Bangtan 🎶" onStart={start}>
          Las notas bajan por tres carriles. Tocá el botón de abajo justo cuando cada nota pasa por la línea: perfecto vale 3, bien vale 1. ¡Subí el sonido!
        </GameIntro>
      )}
      {phase === 'over' && (
        <div className="game-overlay">
          <GameResult key={round} game="ritmo" score={score} detail={`Mejor combo: ${best}.`} onAgain={start} onClose={onClose} />
        </div>
      )}
    </GameShell>
  );
}
