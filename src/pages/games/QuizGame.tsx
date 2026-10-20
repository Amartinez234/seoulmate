// Quiz ARMY: 10 preguntas al azar sobre BTS (datos, sin letras de canciones).
import { useState } from 'react';
import { quizRound, QUIZ_ROUND } from '../../lib/games';
import { QUIZ_BANK } from '../../lib/quiz';
import { GameResult, GameShell } from './GameShell';

export function QuizGame({ onClose }: { onClose: () => void }) {
  const [qs, setQs] = useState(() => quizRound(QUIZ_BANK));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [right, setRight] = useState(0);
  const [round, setRound] = useState(0);
  const done = i >= qs.length;
  const q = qs[Math.min(i, qs.length - 1)];

  const pick = (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    if (k === q.answer) setRight((r) => r + 1);
  };
  const next = () => {
    setPicked(null);
    setI((n) => n + 1);
  };
  const again = () => {
    setQs(quizRound(QUIZ_BANK));
    setI(0);
    setPicked(null);
    setRight(0);
    setRound((r) => r + 1);
  };

  return (
    <GameShell title="Quiz ARMY" onClose={onClose} score={`${right} ✓ · ${Math.min(i + 1, qs.length)}/${qs.length}`}>
      {!done && (
        <div className="quiz card">
          <div className="tiny muted">Pregunta {i + 1} de {qs.length}</div>
          <h2 className="quiz-q">{q.q}</h2>
          <div className="quiz-options">
            {q.options.map((o, k) => {
              const state = picked === null ? '' : k === q.answer ? 'right' : k === picked ? 'wrong' : 'dim';
              return (
                <button key={o} type="button" className={`quiz-opt ${state}`} onClick={() => pick(k)} disabled={picked !== null} data-testid="quiz-option">
                  {o}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className="row spread" style={{ marginTop: 12 }}>
              <strong aria-live="polite">{picked === q.answer ? '¡Correcto! 💜' : `Era: ${q.options[q.answer]}`}</strong>
              <button className="btn sm" onClick={next} type="button">
                {i + 1 < qs.length ? 'Siguiente' : 'Ver resultado'}
              </button>
            </div>
          )}
        </div>
      )}
      {done && (
        <div className="game-overlay">
          <GameResult
            key={round}
            game="quiz"
            score={right * 10}
            detail={`Acertaste ${right} de ${QUIZ_ROUND}. ${right >= 8 ? '¡ARMY de verdad! 💜' : right >= 5 ? '¡Muy bien!' : '¡A seguir aprendiendo!'}`}
            onAgain={again}
            onClose={onClose}
          />
        </div>
      )}
    </GameShell>
  );
}
