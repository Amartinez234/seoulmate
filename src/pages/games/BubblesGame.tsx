// Burbujas Borahae: reventar burbujas moradas que suben; las nubes de lluvia restan.
import { useRef, useState } from 'react';
import { BUBBLES_SECONDS, bubblePoints, bubbleY, spawnBubble, type Bubble } from '../../lib/games2';
import { GameIntro, GameResult, GameShell, useFrame } from './GameShell';

const FACE: Record<Bubble['kind'], string> = { morada: '💜', dorada: '⭐', nube: '🌧️' };

export function BubblesGame({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<'intro' | 'play' | 'over'>('intro');
  const [round, setRound] = useState(0);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [t, setT] = useState(0);
  const [score, setScore] = useState(0);
  const [popped, setPopped] = useState(0);
  const [pops, setPops] = useState<Array<{ id: number; x: number; y: number; text: string }>>([]);
  const st = useRef({ t: 0, seq: 0, next: 0, list: [] as Bubble[] });

  useFrame(
    phase === 'play',
    (dt) => {
      const s = st.current;
      s.t += dt;
      s.next -= dt;
      if (s.next <= 0) {
        s.list = [...s.list, spawnBubble(++s.seq, s.t)];
        s.next = Math.max(0.28, 0.7 - s.t / 80);
      }
      s.list = s.list.filter((b) => bubbleY(b, s.t) > -0.15);
      setBubbles(s.list);
      setT(s.t);
      if (s.t >= BUBBLES_SECONDS) setPhase('over');
    },
    [round],
  );

  const pop = (b: Bubble) => {
    if (phase !== 'play') return;
    st.current.list = st.current.list.filter((x) => x.id !== b.id);
    setBubbles(st.current.list);
    const pts = bubblePoints(b);
    setScore((s) => Math.max(0, s + pts));
    if (pts > 0) setPopped((n) => n + 1);
    const p = { id: b.id, x: b.x, y: bubbleY(b, st.current.t), text: pts > 0 ? `+${pts}` : `${pts}` };
    setPops((list) => [...list, p]);
    setTimeout(() => setPops((list) => list.filter((x) => x !== p)), 600);
  };
  const start = () => {
    st.current = { t: 0, seq: 0, next: 0, list: [] };
    setBubbles([]);
    setScore(0);
    setPopped(0);
    setT(0);
    setPhase('play');
    setRound((r) => r + 1);
  };

  return (
    <GameShell title="Burbujas Borahae" onClose={onClose} score={`${score} 💜 · ${Math.max(0, Math.ceil(BUBBLES_SECONDS - t))} s`}>
      <div className="bubbles" data-testid="bubbles">
        {bubbles.map((b) => (
          <button
            key={b.id}
            type="button"
            className={`bubble b-${b.kind}`}
            style={{ left: `${b.x * 100}%`, top: `${bubbleY(b, t) * 100}%`, width: b.size, height: b.size }}
            onPointerDown={() => pop(b)}
            aria-label={b.kind === 'nube' ? 'Nube' : 'Burbuja'}
            data-testid="bubble"
            data-kind={b.kind}
          >
            {FACE[b.kind]}
          </button>
        ))}
        {pops.map((p) => (
          <span key={p.id} className="bubble-pop" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}>
            {p.text}
          </span>
        ))}
      </div>
      {phase === 'intro' && (
        <GameIntro title="Burbujas Borahae 🫧" onStart={start}>
          Reventá las burbujas moradas antes de que se escapen (1 punto) y las estrellas doradas (5 puntos). Ojo con las nubes de lluvia: restan 2. Tenés {BUBBLES_SECONDS} segundos.
        </GameIntro>
      )}
      {phase === 'over' && (
        <div className="game-overlay">
          <GameResult key={round} game="burbujas" score={score} detail={`Reventaste ${popped} burbujas.`} onAgain={start} onClose={onClose} />
        </div>
      )}
    </GameShell>
  );
}
