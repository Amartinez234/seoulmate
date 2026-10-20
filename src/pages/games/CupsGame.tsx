// ¿Dónde está el gatito?: se esconde bajo un vaso de bubble tea, los vasos se mezclan y hay que encontrarlo.
import { useEffect, useRef, useState } from 'react';
import { cupSwaps } from '../../lib/games2';
import { petDoc } from '../../lib/docs';
import { Cat } from '../../components/Cat';
import { GameIntro, GameResult, GameShell } from './GameShell';

const ROUNDS = 5;
type Phase = 'intro' | 'peek' | 'shuffle' | 'pick' | 'reveal' | 'over';

export function CupsGame({ onClose }: { onClose: () => void }) {
  const pet = petDoc.get();
  const [phase, setPhase] = useState<Phase>('intro');
  const [slots, setSlots] = useState([0, 1, 2]); // slots[cupId] = posición
  const [catCup, setCatCup] = useState(0);
  const [stage, setStage] = useState(0);
  const [wins, setWins] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [speed, setSpeed] = useState(420);
  const [round, setRound] = useState(0);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const play = (n: number) => {
    const cat = Math.floor(Math.random() * 3);
    const ms = Math.max(200, 430 - n * 50);
    setSpeed(ms);
    setCatCup(cat);
    setPicked(null);
    setSlots([0, 1, 2]);
    setPhase('peek');
    const swaps = cupSwaps(Math.random, 4 + n * 2);
    later(() => setPhase('shuffle'), 1300);
    swaps.forEach(([a, b], k) =>
      later(() => {
        setSlots((cur) => cur.map((p) => (p === a ? b : p === b ? a : p)));
      }, 1500 + k * (ms + 40)),
    );
    later(() => setPhase('pick'), 1600 + swaps.length * (ms + 40));
  };
  const start = () => {
    setStage(0);
    setWins(0);
    setRound((r) => r + 1);
    play(0);
  };
  const pick = (cup: number) => {
    if (phase !== 'pick') return;
    setPicked(cup);
    setPhase('reveal');
    if (cup === catCup) setWins((w) => w + 1);
  };
  const next = () => {
    if (stage + 1 >= ROUNDS) setPhase('over');
    else {
      setStage(stage + 1);
      play(stage + 1);
    }
  };

  const showCat = phase === 'peek' || phase === 'reveal';
  return (
    <GameShell title="¿Dónde está el gatito?" onClose={onClose} score={`${wins} ✓ · ${Math.min(stage + 1, ROUNDS)}/${ROUNDS}`}>
      <p className="small muted center" aria-live="polite">
        {phase === 'peek' ? `${pet.name} se esconde acá… ¡mirá bien!` : phase === 'shuffle' ? 'Mezclando…' : phase === 'pick' ? '¿Debajo de qué vaso está?' : phase === 'reveal' ? (picked === catCup ? '¡Lo encontraste! 💜' : '¡Uy! Estaba en otro vaso.') : ' '}
      </p>
      <div className="cups" data-testid="cups">
        {[0, 1, 2].map((cup) => (
          <button
            key={cup}
            type="button"
            className={`cup ${showCat && (phase === 'peek' || cup === catCup || cup === picked) ? 'up' : ''}`}
            style={{ left: `${slots[cup] * 33.33 + 16.66}%`, transitionDuration: `${speed}ms` }}
            onClick={() => pick(cup)}
            disabled={phase !== 'pick'}
            aria-label={`Vaso ${slots[cup] + 1}`}
            data-testid="cup"
            data-cat={cup === catCup ? '1' : '0'}
          >
            <span className="cup-body" aria-hidden="true">
              <span className="cup-straw" />
              <span className="cup-dots" />
            </span>
            {cup === catCup && (
              <span className="cup-cat" aria-hidden="true">
                <Cat breed={pet.breed} mood="gift" size={64} />
              </span>
            )}
          </button>
        ))}
      </div>
      {phase === 'reveal' && (
        <button className="btn" onClick={next} type="button" style={{ alignSelf: 'center' }}>
          {stage + 1 < ROUNDS ? 'Otra vez' : 'Ver resultado'}
        </button>
      )}
      {phase === 'intro' && (
        <GameIntro title="¿Dónde está el gatito? 🧋" onStart={start}>
          {pet.name} se esconde debajo de un vaso de bubble tea. Los vasos se mezclan, cada vez más rápido: seguilo con la mirada y tocá el vaso correcto. Son {ROUNDS} rondas.
        </GameIntro>
      )}
      {phase === 'over' && (
        <div className="game-overlay">
          <GameResult key={round} game="vasos" score={wins * 10} detail={`Lo encontraste ${wins} de ${ROUNDS} veces.`} onAgain={start} onClose={onClose} />
        </div>
      )}
    </GameShell>
  );
}
