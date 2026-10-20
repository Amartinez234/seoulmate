// Gatito saltarín: corre por el escenario, salta obstáculos y junta corazones.
import { useRef, useState } from 'react';
import { HOP_CAT_X, jump, newHopper, stepHopper, type Hopper } from '../../lib/games2';
import { petDoc } from '../../lib/docs';
import { Cat } from '../../components/Cat';
import { GameIntro, GameResult, GameShell, useFrame } from './GameShell';

const GROUND = 0.2; // alto del piso, en proporción al área

export function HopperGame({ onClose }: { onClose: () => void }) {
  const pet = petDoc.get();
  const [phase, setPhase] = useState<'intro' | 'play' | 'over'>('intro');
  const [round, setRound] = useState(0);
  const [view, setView] = useState<Hopper>(newHopper);
  const s = useRef<Hopper>(view);

  useFrame(
    phase === 'play',
    (dt) => {
      s.current = stepHopper(s.current, dt);
      setView(s.current);
      if (s.current.over) setPhase('over');
    },
    [round],
  );

  const start = () => {
    s.current = newHopper();
    setView(s.current);
    setPhase('play');
    setRound((r) => r + 1);
  };
  const tap = () => {
    if (phase === 'play') s.current = jump(s.current);
  };
  const bottom = (y: number) => `${(GROUND + y) * 100}%`;

  return (
    <GameShell title="Gatito saltarín" onClose={onClose} score={`${view.score} pts`}>
      <div
        className="hopper"
        data-testid="hopper"
        onPointerDown={tap}
        onKeyDown={(e) => (e.key === ' ' || e.key === 'ArrowUp') && tap()}
        tabIndex={0}
        role="button"
        aria-label="Tocá para saltar"
      >
        <div className="hop-sky" style={{ backgroundPositionX: `${-view.dist * 300}px` }} aria-hidden="true" />
        <div className="hop-ground" style={{ height: bottom(0), backgroundPositionX: `${-view.dist * 900}px` }} aria-hidden="true" />
        {view.obstacles.map((o) => (
          <span key={o.id} className="hop-obstacle" style={{ left: `${o.x * 100}%`, bottom: bottom(0), width: `${o.w * 100}%`, height: `${o.h * 100}%` }}>
            {o.kind}
          </span>
        ))}
        {view.coins.map((c) => (
          <span key={c.id} className="hop-coin" style={{ left: `${c.x * 100}%`, bottom: bottom(c.y) }}>
            💜
          </span>
        ))}
        <div className="hop-cat" style={{ left: `${HOP_CAT_X * 100}%`, bottom: bottom(view.y) }}>
          <Cat breed={pet.breed} accessory={pet.equipped.accessory} mood={view.y > 0 ? 'play' : phase === 'over' ? 'wait' : 'idle'} size={76} />
        </div>
      </div>
      <p className="tiny muted center" style={{ marginTop: 8 }}>
        Tocá la pantalla para saltar. Los corazones en el aire valen 3.
      </p>
      {phase === 'intro' && (
        <GameIntro title="Gatito saltarín 🐾" onStart={start}>
          {pet.name} va corriendo al concierto. Tocá la pantalla para saltar los micrófonos y las cajas, y agarrá los corazones que flotan. Cuanto más lejos llegues, más puntos.
        </GameIntro>
      )}
      {phase === 'over' && (
        <div className="game-overlay">
          <GameResult key={round} game="saltarin" score={view.score} detail={`Recorriste ${Math.round(view.dist * 10)} metros.`} onAgain={start} onClose={onClose} />
        </div>
      )}
    </GameShell>
  );
}
