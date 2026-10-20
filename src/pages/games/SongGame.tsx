// Adiviná la canción: ahorcado con títulos de canciones de BTS (solo el título).
import { useState } from 'react';
import { HANGMAN_LIVES, maskSong, pickSong, songSolved, wrongGuesses } from '../../lib/games2';
import { petDoc } from '../../lib/docs';
import { Cat } from '../../components/Cat';
import { GameResult, GameShell } from './GameShell';

const ROUNDS = 5;
const KEYS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');

export function SongGame({ onClose }: { onClose: () => void }) {
  const pet = petDoc.get();
  const [played, setPlayed] = useState<string[]>([]);
  const [song, setSong] = useState(() => pickSong());
  const [guessed, setGuessed] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [stage, setStage] = useState(0);
  const wrong = wrongGuesses(song, guessed);
  const solved = songSolved(song, guessed);
  const lost = wrong >= HANGMAN_LIVES;
  const finished = stage >= ROUNDS;

  const guess = (k: string) => {
    if (solved || lost || guessed.includes(k)) return;
    const g = [...guessed, k];
    setGuessed(g);
    if (songSolved(song, g)) setScore((s) => s + 10 + (HANGMAN_LIVES - wrongGuesses(song, g)) * 2);
  };
  const next = () => {
    const p = [...played, song];
    setPlayed(p);
    setStage(stage + 1);
    setSong(pickSong(Math.random, p));
    setGuessed([]);
  };
  const again = () => {
    setPlayed([]);
    setSong(pickSong());
    setGuessed([]);
    setScore(0);
    setStage(0);
    setRound((r) => r + 1);
  };

  return (
    <GameShell title="Adiviná la canción" onClose={onClose} score={`${score} pts · ${Math.min(stage + 1, ROUNDS)}/${ROUNDS}`}>
      {!finished && (
        <div className="quiz card center">
          <Cat breed={pet.breed} accessory={pet.equipped.accessory} mood={solved ? 'gift' : lost ? 'tired' : wrong > 3 ? 'wait' : 'idle'} size={90} />
          <div className="tiny muted">Una canción de BTS · {'💜'.repeat(HANGMAN_LIVES - wrong)}{'🤍'.repeat(Math.min(wrong, HANGMAN_LIVES))}</div>
          <div className="song-mask" data-testid="song-mask" aria-label={solved || lost ? song : 'Título oculto'}>
            {(solved || lost ? song : maskSong(song, guessed)).split('').map((ch, i) => (
              <span key={i} className={ch === ' ' ? 'gap' : ''}>
                {ch === ' ' ? '' : ch}
              </span>
            ))}
          </div>
          {!solved && !lost ? (
            <div className="keys">
              {KEYS.map((k) => (
                <button key={k} type="button" className={`key ${guessed.includes(k) ? (song.toUpperCase().includes(k) ? 'hit' : 'miss') : ''}`} onClick={() => guess(k)} disabled={guessed.includes(k)}>
                  {k}
                </button>
              ))}
            </div>
          ) : (
            <div className="row spread" style={{ width: '100%', marginTop: 8 }}>
              <strong aria-live="polite">{solved ? '¡La adivinaste! 💜' : `Era "${song}"`}</strong>
              <button className="btn sm" onClick={next} type="button">
                {stage + 1 < ROUNDS ? 'Siguiente' : 'Ver resultado'}
              </button>
            </div>
          )}
        </div>
      )}
      {finished && (
        <div className="game-overlay">
          <GameResult key={round} game="cancion" score={score} detail={`Jugaste ${ROUNDS} canciones.`} onAgain={again} onClose={onClose} />
        </div>
      )}
    </GameShell>
  );
}
