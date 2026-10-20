// Lluvia morada: el gatito atrapa corazones y cosas de BTS que caen del cielo.
import { useEffect, useRef, useState } from 'react';
import { CATCH_LINE, moveCat, newCatch, stepCatch, type CatchState } from '../../lib/games';
import { petDoc } from '../../lib/docs';
import { Cat } from '../../components/Cat';
import { GameResult, GameShell } from './GameShell';

export function CatchGame({ onClose }: { onClose: () => void }) {
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<'intro' | 'play' | 'over'>('intro');
  const [view, setView] = useState<CatchState>(newCatch);
  const state = useRef<CatchState>(view);
  const area = useRef<HTMLDivElement>(null);
  const [bonus, setBonus] = useState<string | null>(null);
  const pet = petDoc.get();

  useEffect(() => {
    if (phase !== 'play') return;
    let raf = 0;
    let last = performance.now();
    let shownBonus: string | null = null;
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (!document.hidden) {
        const before = state.current.caught;
        state.current = stepCatch(state.current, dt);
        const s = state.current;
        if (s.caught > before && s.lastBonus && s.lastBonus !== shownBonus) {
          shownBonus = s.lastBonus;
          setBonus(`¡Atrapaste a ${s.lastBonus}! +5`);
          setTimeout(() => setBonus(null), 1200);
          state.current = { ...s, lastBonus: null };
          shownBonus = null;
        }
        setView(state.current);
        if (state.current.over) {
          setPhase('over');
          return;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onKey = (e: KeyboardEvent) => {
      const d = e.key === 'ArrowLeft' ? -0.06 : e.key === 'ArrowRight' ? 0.06 : 0;
      if (d) state.current = moveCat(state.current, state.current.catX + d);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
    };
  }, [phase, round]);

  const follow = (clientX: number) => {
    const r = area.current?.getBoundingClientRect();
    if (!r || phase !== 'play') return;
    state.current = moveCat(state.current, (clientX - r.left) / r.width);
  };
  const start = () => {
    state.current = newCatch();
    setView(state.current);
    setPhase('play');
    setRound((n) => n + 1);
  };

  return (
    <GameShell title="Lluvia morada" onClose={onClose} score={`${view.score} 💜 · ${'❤️'.repeat(Math.max(0, view.lives))}`}>
      <div
        className="catch-area"
        ref={area}
        data-testid="catch-area"
        onPointerDown={(e) => follow(e.clientX)}
        onPointerMove={(e) => follow(e.clientX)}
      >
        <div className="catch-stars" aria-hidden="true" />
        {view.items.map((it) => (
          <span key={it.id} className={`catch-item ${it.label ? 'bonus' : ''}`} style={{ left: `${it.x * 100}%`, top: `${it.y * 100}%` }} aria-hidden="true">
            {it.emoji}
          </span>
        ))}
        <div className="catch-cat" style={{ left: `${view.catX * 100}%`, top: `${CATCH_LINE * 100}%` }}>
          <Cat breed={pet.breed} accessory={pet.equipped.accessory} mood={phase === 'play' ? 'play' : 'idle'} size={84} />
        </div>
        {bonus && <div className="catch-bonus">{bonus}</div>}
        {phase === 'intro' && (
          <div className="game-overlay">
            <div className="card center">
              <h2>Lluvia morada 💜</h2>
              <p className="small">
                Mové a {pet.name} con el dedo para atrapar los corazones morados, micrófonos, discos y flores. Si cae un integrante (🐨🐹🐱🐿️🐥🐯🐰) vale 5 puntos.
                Se pierde una vida por cada cosa que llega al piso, salvo los integrantes.
              </p>
              <button className="btn" onClick={start} type="button">
                ¡Empezar!
              </button>
            </div>
          </div>
        )}
        {phase === 'over' && (
          <div className="game-overlay">
            <GameResult game="atrapar" score={view.score} detail={`Atrapaste ${view.caught} cosas.`} onAgain={start} onClose={onClose} key={round} />
          </div>
        )}
      </div>
    </GameShell>
  );
}
