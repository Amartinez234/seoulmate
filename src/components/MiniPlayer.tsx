// Reproductor fijo sobre la barra inferior, con el reproductor oficial de YouTube visible
// (las condiciones de YouTube piden no ocultar el video mientras suena).
import { useEffect, useRef } from 'react';
import { nextTrack, prevTrack, stopPlayer, usePlayer } from '../lib/player';
import { embedUrl, openInMusicUrl, parseYouTube } from '../lib/youtube';

// En hosts que no permiten insertar otros sitios (p. ej. la versión publicada en claude.ai),
// se compila con VITE_EXTERNAL_PLAYER=1 y el reproductor abre YouTube Music afuera.
const EXTERNAL_PLAYER = import.meta.env.VITE_EXTERNAL_PLAYER === '1';

export function MiniPlayer() {
  const player = usePlayer();
  const frame = useRef<HTMLIFrameElement>(null);
  const track = player ? player.queue[player.index] : null;
  const ref = track ? parseYouTube(track.link) : null;

  // Escucha el fin del video para pasar a la siguiente canción de la cola.
  useEffect(() => {
    if (!track) return;
    const onMsg = (e: MessageEvent) => {
      if (!/youtube(-nocookie)?\.com$/.test(new URL(e.origin).hostname)) return;
      if (e.source !== frame.current?.contentWindow) return;
      let data: { event?: string; info?: unknown };
      try {
        data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      const ended =
        (data.event === 'onStateChange' && data.info === 0) ||
        (data.event === 'infoDelivery' && (data.info as { playerState?: number } | undefined)?.playerState === 0);
      if (ended && !ref?.listId) nextTrack();
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [track, ref?.listId]);

  useEffect(() => {
    document.body.classList.toggle('player-open', !!track);
    return () => document.body.classList.remove('player-open');
  }, [track]);

  if (!player || !track || !ref) return null;
  const listen = () =>
    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*');

  return (
    <section className="miniplayer" aria-label="Reproductor">
      {EXTERNAL_PLAYER ? (
        <a className="btn rose" style={{ width: '100%' }} href={openInMusicUrl(ref)} target="_blank" rel="noreferrer" data-testid="yt-open">
          ▶ Escuchar en YouTube Music
        </a>
      ) : (
      <div className="mp-video">
        <iframe
          key={track.id + player.index}
          ref={frame}
          src={embedUrl(ref, window.location.origin)}
          title={`Reproduciendo: ${track.title}`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={listen}
          data-testid="yt-frame"
        />
      </div>
      )}
      <div className="mp-bar">
        <button className="iconbtn" onClick={prevTrack} disabled={player.index === 0} aria-label="Canción anterior">
          ⏮
        </button>
        <div className="grow mp-title">
          <strong>{track.title}</strong>
          <span className="tiny muted">
            {track.subtitle ? `${track.subtitle} · ` : ''}
            {player.index + 1}/{player.queue.length} ·{' '}
            <a href={openInMusicUrl(ref)} target="_blank" rel="noreferrer">
              Abrir en YouTube Music
            </a>
          </span>
        </div>
        <button className="iconbtn" onClick={nextTrack} disabled={player.index >= player.queue.length - 1} aria-label="Siguiente canción">
          ⏭
        </button>
        <button className="iconbtn" onClick={stopPlayer} aria-label="Cerrar reproductor">
          ✕
        </button>
      </div>
    </section>
  );
}
