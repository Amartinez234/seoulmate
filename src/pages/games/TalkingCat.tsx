// Hablá con tu gatito: escucha por el micrófono y repite lo que decís con voz finita.
// El audio se procesa en el momento y no se guarda en ningún lado.
import { useEffect, useRef, useState } from 'react';
import { petDoc } from '../../lib/docs';
import { Cat, type CatMood } from '../../components/Cat';
import { GameShell } from './GameShell';

type Status = 'off' | 'starting' | 'listening' | 'recording' | 'speaking' | 'denied' | 'unsupported';

const THRESHOLD = 0.035; // volumen (RMS) para considerar que hay voz
const SILENCE_MS = 900;
const MAX_MS = 6000;
const PITCH = 1.5;

const TAP_LINES = ['¡Miau! 💜', 'Prrr… prrr…', '¡Borahae! 💜', '¡Jaja, cosquillas!', '¿Escuchamos BTS?', '¡Apobangpo! 💜'];
const TAP_MOODS: CatMood[] = ['pet', 'play', 'gift'];

export function TalkingCat({ onClose }: { onClose: () => void }) {
  const pet = petDoc.get();
  const [status, setStatus] = useState<Status>('off');
  const [tap, setTap] = useState<{ line: string; mood: CatMood } | null>(null);
  const [level, setLevel] = useState(0);
  const env = useRef<{ stream: MediaStream; ctx: AudioContext; raf: number } | null>(null);
  const statusRef = useRef<Status>('off');
  const set = (s: Status) => {
    statusRef.current = s;
    setStatus(s);
  };

  const stop = () => {
    const e = env.current;
    env.current = null;
    if (!e) return;
    cancelAnimationFrame(e.raf);
    e.stream.getTracks().forEach((t) => t.stop());
    void e.ctx.close();
  };
  useEffect(() => stop, []);

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      set('unsupported');
      return;
    }
    set('starting');
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      set('denied');
      return;
    }
    const ctx = new AudioContext();
    await ctx.resume();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    src.connect(analyser);
    const buf = new Float32Array(analyser.fftSize);
    let recorder: MediaRecorder | null = null;
    let chunks: Blob[] = [];
    let startedAt = 0;
    let lastVoice = 0;

    const play = async (blob: Blob) => {
      try {
        const audio = await ctx.decodeAudioData(await blob.arrayBuffer());
        const node = ctx.createBufferSource();
        node.buffer = audio;
        node.playbackRate.value = PITCH;
        node.connect(ctx.destination);
        set('speaking');
        node.onended = () => set('listening');
        node.start();
      } catch {
        set('listening');
      }
    };

    const loop = () => {
      if (!env.current) return;
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) sum += v * v;
      const rms = Math.sqrt(sum / buf.length);
      setLevel(Math.min(1, rms * 12));
      const now = performance.now();
      const st = statusRef.current;
      if (st === 'listening' && rms > THRESHOLD) {
        chunks = [];
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
        recorder.onstop = () => void play(new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' }));
        recorder.start();
        startedAt = lastVoice = now;
        set('recording');
      } else if (st === 'recording') {
        if (rms > THRESHOLD) lastVoice = now;
        if (now - lastVoice > SILENCE_MS || now - startedAt > MAX_MS) {
          set('speaking'); // evita que se escuche a sí mismo mientras procesa
          recorder?.stop();
        }
      }
      env.current.raf = requestAnimationFrame(loop);
    };
    env.current = { stream, ctx, raf: 0 };
    set('listening');
    env.current.raf = requestAnimationFrame(loop);
  };

  const toggle = () => {
    if (env.current) {
      stop();
      set('off');
    } else void start();
  };
  const poke = () => {
    const line = TAP_LINES[Math.floor(Math.random() * TAP_LINES.length)];
    const mood = TAP_MOODS[Math.floor(Math.random() * TAP_MOODS.length)];
    setTap({ line, mood });
    setTimeout(() => setTap(null), 1400);
  };

  const mood: CatMood = tap?.mood ?? (status === 'speaking' ? 'speak' : status === 'recording' || status === 'listening' ? 'listen' : 'idle');
  const caption: Record<Status, string> = {
    off: `Tocá "Hablar" y decile algo a ${pet.name}: te lo va a repetir con su vocecita.`,
    starting: 'Pidiendo el micrófono…',
    listening: `${pet.name} te está escuchando… 👂`,
    recording: 'Escuchando… 🎙️',
    speaking: `${pet.name} está hablando 💬`,
    denied: 'No hay permiso para el micrófono. Podés darlo en Ajustes > Safari > Micrófono, y volver a tocar "Hablar".',
    unsupported: 'Este navegador no permite grabar audio. Probá con Safari actualizado.',
  };

  return (
    <GameShell title={`Hablá con ${pet.name}`} onClose={onClose}>
      <div className={`talk-room wp-${pet.equipped.wallpaper}`}>
        {tap && <div className="speech">{tap.line}</div>}
        <button type="button" className="talk-cat" onClick={poke} aria-label={`Hacerle cosquillas a ${pet.name}`}>
          <Cat breed={pet.breed} accessory={pet.equipped.accessory} mood={mood} size={220} />
        </button>
      </div>
      <p className="small center" aria-live="polite" data-testid="talk-status" data-status={status}>
        {caption[status]}
      </p>
      <div className="talk-meter" aria-hidden="true">
        <span style={{ width: `${status === 'off' ? 0 : level * 100}%` }} />
      </div>
      <button className={`btn block ${env.current ? 'secondary' : ''}`} onClick={toggle} type="button">
        {env.current ? 'Dejar de hablar' : '🎙️ Hablar'}
      </button>
      <p className="tiny muted center" style={{ marginTop: 8 }}>
        Lo que decís no se graba ni se guarda: el gatito lo repite y se borra.
      </p>
    </GameShell>
  );
}
