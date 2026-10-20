// Concierto: el público se va iluminando y hay que encender cada luz antes de que se apague.
import { useEffect, useRef, useState } from 'react';
import { LIGHTS_SEATS, LIGHTS_SECONDS, lightPoints, spawnLight, type Light } from '../../lib/games';
import { GameResult, GameShell } from './GameShell';

interface Pop {
  id: number;
  seat: number;
  text: string;
}

export function LightsGame({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<'intro' | 'play' | 'over'>('intro');
  const [lights, setLights] = useState<Light[]>([]);
  const [lit, setLit] = useState<number[]>([]); // asientos que ella ya encendió (brillan un momento)
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [t, setT] = useState(0);
  const [round, setRound] = useState(0);
  const [pops, setPops] = useState<Pop[]>([]);
  const lightsRef = useRef<Light[]>([]);
  const tRef = useRef(0);
  const popSeq = useRef(0);

  useEffect(() => {
    if (phase !== 'play') return;
    let raf = 0;
    let last = performance.now();
    let nextSpawn = 0.3;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!document.hidden) {
        tRef.current += dt;
        const time = tRef.current;
        let ls = lightsRef.current.filter((l) => l.until > time);
        nextSpawn -= dt;
        const maxOn = time > 15 ? 3 : 2;
        if (nextSpawn <= 0 && ls.length < maxOn) {
          const l = spawnLight(ls, time);
          if (l) ls = [...ls, l];
          nextSpawn = Math.max(0.35, 0.8 - time / 60);
        }
        lightsRef.current = ls;
        setLights(ls);
        setT(time);
        if (time >= LIGHTS_SECONDS) {
          setPhase('over');
          return;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, round]);

  const tap = (seat: number) => {
    if (phase !== 'play') return;
    const l = lightsRef.current.find((x) => x.seat === seat);
    if (!l) return;
    const pts = lightPoints(l);
    lightsRef.current = lightsRef.current.filter((x) => x !== l);
    setLights(lightsRef.current);
    setScore((s) => s + pts);
    setHits((h) => h + 1);
    setLit((v) => [...v, seat]);
    setTimeout(() => setLit((v) => v.filter((x) => x !== seat)), 350);
    const pop = { id: ++popSeq.current, seat, text: pts > 1 ? `+${pts} 🌟` : '+1 💜' };
    setPops((p) => [...p, pop]);
    setTimeout(() => setPops((p) => p.filter((x) => x !== pop)), 700);
  };
  const start = () => {
    lightsRef.current = [];
    tRef.current = 0;
    setLights([]);
    setScore(0);
    setHits(0);
    setT(0);
    setPhase('play');
    setRound((r) => r + 1);
  };

  return (
    <GameShell title="Concierto morado" onClose={onClose} score={`${score} 💜 · ${Math.max(0, Math.ceil(LIGHTS_SECONDS - t))} s`}>
      <div className="stage">
        <div className="stage-lights" aria-hidden="true" />
        <div className="stage-floor">🎤</div>
      </div>
      <div className="lights-grid">
        {Array.from({ length: LIGHTS_SEATS }, (_, seat) => {
          const l = lights.find((x) => x.seat === seat);
          return (
            <button
              key={seat}
              type="button"
              className={`seat ${l ? `on ${l.kind}` : ''} ${lit.includes(seat) ? 'lit' : ''}`}
              onPointerDown={() => tap(seat)}
              aria-label={l ? (l.kind === 'dorada' ? 'Luz dorada encendida' : 'Luz encendida') : 'Luz apagada'}
              data-testid="seat"
            >
              <span className="lightstick" aria-hidden="true">
                <span className="bulb" />
                <span className="stick" />
              </span>
              {pops
                .filter((p) => p.seat === seat)
                .map((p) => (
                  <span key={p.id} className="pop">
                    {p.text}
                  </span>
                ))}
            </button>
          );
        })}
      </div>
      {phase === 'intro' && (
        <div className="game-overlay">
          <div className="card center">
            <h2>Concierto morado 🎤</h2>
            <p className="small">
              El estadio se está llenando de luces. Tocá cada luz que se prende antes de que se apague, para formar el mar morado. Las doradas valen 3. Tenés{' '}
              {LIGHTS_SECONDS} segundos.
            </p>
            <button className="btn" onClick={start} type="button">
              ¡Empezar!
            </button>
          </div>
        </div>
      )}
      {phase === 'over' && (
        <div className="game-overlay">
          <GameResult key={round} game="luces" score={score} detail={`Encendiste ${hits} luces.`} onAgain={start} onClose={onClose} />
        </div>
      )}
    </GameShell>
  );
}
