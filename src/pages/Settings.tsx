import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useDoc } from '../lib/store';
import { settingsDoc } from '../lib/docs';
import { changePassphrase, wipeEverything } from '../lib/vault';
import { setAuthorPin, useAuthorMode, validatePin, verifyAuthorPin } from '../lib/session';
import { applyBackup, collectContent, decryptBackup, downloadJson, encryptBackup, type BackupKind } from '../lib/backup';
import { getSupabase, supabaseRemote, syncConfigured, syncNow } from '../lib/sync';
import { isIos, isStandalone, promptInstall, useCanInstall } from '../lib/install';
import { todayKey } from '../lib/dates';
import { BUILD_ID, checkForUpdate } from '../lib/update';
import { DeleteButton, Field, errorMessage, toast } from '../components/ui';

export function SettingsPage() {
  return (
    <div className="page">
      <Profile />
      <Security />
      <Install />
      <Backups />
      <Sync />
      <AppVersion />
      <Danger />
      <p className="tiny muted center">Seoulmate v1.0 · Hecho con cariño, solo para vos 💜</p>
    </div>
  );
}

function Profile() {
  const s = useDoc(settingsDoc);
  const [nick, setNick] = useState(s.nickname);
  const [phrase, setPhrase] = useState('');
  const [err, setErr] = useState('');
  const saveNick = async (e: FormEvent) => {
    e.preventDefault();
    const n = nick.trim();
    if (!n) return setErr('El apodo no puede quedar vacío.');
    if (n.length > 30) return setErr('Máximo 30 caracteres.');
    await settingsDoc.update((x) => ({ ...x, nickname: n }));
    setErr('');
    toast('Apodo guardado');
  };
  const addPhrase = async (e: FormEvent) => {
    e.preventDefault();
    const p = phrase.trim();
    if (!p || p.length > 200) return;
    await settingsDoc.update((x) => ({ ...x, customPhrases: [...x.customPhrases, p] }));
    setPhrase('');
  };
  return (
    <section className="card">
      <h2>Perfil</h2>
      <form onSubmit={saveNick} className="row" style={{ alignItems: 'flex-start' }} noValidate>
        <div className="grow">
          <Field label="Nombre o apodo para el saludo" error={err}>
            <input value={nick} onChange={(e) => setNick(e.target.value)} />
          </Field>
        </div>
        <button className="btn sm" style={{ marginTop: 28 }}>
          Guardar
        </button>
      </form>
      <h3>Frases del día propias</h3>
      <p className="small muted">Se suman a la rotación de frases de la pantalla de inicio.</p>
      {s.customPhrases.map((p, i) => (
        <div className="item" key={i} style={{ alignItems: 'center' }}>
          <span className="grow small">{p}</span>
          <DeleteButton label="Quitar frase" onConfirm={() => settingsDoc.update((x) => ({ ...x, customPhrases: x.customPhrases.filter((_, j) => j !== i) }))} />
        </div>
      ))}
      <form onSubmit={addPhrase} className="row">
        <input className="input grow" value={phrase} onChange={(e) => setPhrase(e.target.value)} placeholder="Escribí una frase…" maxLength={200} aria-label="Nueva frase" />
        <button className="btn sm">Agregar</button>
      </form>
    </section>
  );
}

function Security() {
  const s = useDoc(settingsDoc);
  const author = useAuthorMode();
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [next2, setNext2] = useState('');
  const [perr, setPerr] = useState('');
  const [busy, setBusy] = useState(false);
  const [pinCur, setPinCur] = useState('');
  const [pin, setPin] = useState('');
  const [pinErr, setPinErr] = useState('');

  const change = async (e: FormEvent) => {
    e.preventDefault();
    if (next !== next2) return setPerr('Las contraseñas nuevas no coinciden.');
    setBusy(true);
    try {
      await changePassphrase(cur, next);
      setCur('');
      setNext('');
      setNext2('');
      setPerr('');
      toast('Contraseña cambiada. Todo se volvió a cifrar.');
    } catch (err) {
      setPerr(errorMessage(err));
    }
    setBusy(false);
  };

  const savePin = async (e: FormEvent) => {
    e.preventDefault();
    if (s.authorPin && !author && !(await verifyAuthorPin(pinCur))) return setPinErr('El PIN actual no es correcto.');
    const v = validatePin(pin);
    if (v) return setPinErr(v);
    await setAuthorPin(pin);
    setPin('');
    setPinCur('');
    setPinErr('');
    toast('PIN de autor guardado');
  };

  return (
    <section className="card">
      <h2>Privacidad y seguridad</h2>
      <p className="small muted">
        Todo se guarda cifrado (AES-256) en este dispositivo con tu contraseña. Nada sale del teléfono salvo que exportes una copia o
        actives la sincronización.
      </p>
      <Field label="Bloquear automáticamente tras">
        <select value={s.autoLockMinutes} onChange={(e) => settingsDoc.update((x) => ({ ...x, autoLockMinutes: Number(e.target.value) }))}>
          {[1, 5, 15, 30].map((m) => (
            <option key={m} value={m}>
              {m} {m === 1 ? 'minuto' : 'minutos'} sin uso
            </option>
          ))}
        </select>
      </Field>
      <details>
        <summary style={{ fontWeight: 700, cursor: 'pointer', minHeight: 32 }}>Cambiar contraseña</summary>
        <form onSubmit={change} style={{ marginTop: 10 }} noValidate>
          <Field label="Contraseña actual">
            <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
          </Field>
          <Field label="Nueva contraseña">
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Repetir nueva contraseña" error={perr}>
            <input type="password" value={next2} onChange={(e) => setNext2(e.target.value)} autoComplete="new-password" />
          </Field>
          <button className="btn sm" disabled={busy}>
            {busy ? 'Cifrando de nuevo…' : 'Cambiar contraseña'}
          </button>
        </form>
      </details>
      <div className="divider" />
      <h3>PIN de autor (Nuestro capítulo)</h3>
      <p className="small muted">
        Protege la edición de cartas, sorpresas y recuerdos. Útil si quien prepara el regalo carga el contenido en este mismo teléfono.
        {s.authorPin ? ' Hay un PIN configurado.' : ' Todavía no hay PIN: cualquiera con la app abierta puede entrar en modo autor.'}
      </p>
      <form onSubmit={savePin} noValidate>
        {s.authorPin && !author && (
          <Field label="PIN actual">
            <input type="password" inputMode="numeric" value={pinCur} onChange={(e) => setPinCur(e.target.value)} />
          </Field>
        )}
        <Field label={s.authorPin ? 'Nuevo PIN' : 'PIN (4 a 8 números)'} error={pinErr}>
          <input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} />
        </Field>
        <button className="btn sm">Guardar PIN</button>
      </form>
    </section>
  );
}

function Install() {
  const can = useCanInstall();
  const standalone = isStandalone();
  return (
    <section className="card">
      <h2>Instalar en el celular</h2>
      {standalone ? (
        <p className="small">✅ Ya estás usando Seoulmate como app instalada.</p>
      ) : can ? (
        <button className="btn" onClick={() => promptInstall()}>
          Instalar Seoulmate
        </button>
      ) : isIos() ? (
        <p className="small">
          En iPhone: abrí esta página en <strong>Safari</strong>, tocá el botón <strong>Compartir</strong> y elegí{' '}
          <strong>"Agregar a pantalla de inicio"</strong>.
        </p>
      ) : (
        <p className="small">
          En Android con Chrome: menú <strong>⋮</strong> → <strong>"Instalar app"</strong> o <strong>"Agregar a pantalla principal"</strong>.
          (Requiere abrir la app desde una dirección https.)
        </p>
      )}
    </section>
  );
}

function Backups() {
  const author = useAuthorMode();
  const [pw, setPw] = useState('');
  const [kind, setKind] = useState<BackupKind>('full');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importText, setImportText] = useState<string | null>(null);
  const [importPw, setImportPw] = useState('');
  const [importErr, setImportErr] = useState('');

  const doExport = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const file = await encryptBackup(kind, await collectContent(kind), pw);
      downloadJson(`seoulmate-${kind === 'full' ? 'copia' : 'capitulo'}-${todayKey()}.json`, file);
      toast('Archivo exportado. Guardalo en un lugar seguro.');
      setPw('');
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
    setBusy(false);
  };

  const doImport = async (e: FormEvent) => {
    e.preventDefault();
    if (!importText) return;
    setBusy(true);
    try {
      const { kind: k, content } = await decryptBackup(importText, importPw);
      await applyBackup(k, content);
      toast(k === 'chapter' ? 'Capítulo importado y combinado 💌' : 'Copia restaurada');
      setImportText(null);
      setImportPw('');
      setImportErr('');
    } catch (err) {
      setImportErr(errorMessage(err));
    }
    setBusy(false);
  };

  return (
    <section className="card">
      <h2>Copias de seguridad</h2>
      <p className="small muted">
        Los archivos se cifran con la contraseña que elijas. El <strong>paquete del capítulo</strong> sirve para preparar cartas,
        fotos y sorpresas en otro teléfono y pasarlas a este: nunca incluye el diario personal.
      </p>
      <form onSubmit={doExport} noValidate>
        <Field label="¿Qué exportar?">
          <select value={kind} onChange={(e) => setKind(e.target.value as BackupKind)}>
            <option value="full">Copia completa (todo)</option>
            <option value="chapter" disabled={!author}>
              Paquete de Nuestro capítulo {author ? '' : '(requiere modo autor)'}
            </option>
          </select>
        </Field>
        <Field label="Contraseña del archivo" help="Mínimo 6 caracteres. Se necesitará para importarlo.">
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
        </Field>
        <button className="btn sm" disabled={busy || pw.length < 6}>
          Exportar
        </button>
      </form>
      <div className="divider" />
      <form onSubmit={doImport} noValidate>
        <h3>Importar</h3>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          data-testid="import-file"
          aria-label="Archivo de copia"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            setImportErr('');
            setImportText(f ? await f.text() : null);
          }}
        />
        {importText && (
          <>
            <div style={{ height: 10 }} />
            <Field label="Contraseña del archivo" error={importErr} help="Una copia completa reemplaza los datos actuales; un paquete del capítulo se combina.">
              <input type="password" value={importPw} onChange={(e) => setImportPw(e.target.value)} />
            </Field>
            <button className="btn sm" disabled={busy || !importPw}>
              Importar
            </button>
          </>
        )}
      </form>
    </section>
  );
}

function Sync() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [syncPass, setSyncPass] = useState('');
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const configured = syncConfigured();

  useEffect(() => {
    if (!configured) return;
    getSupabase()
      .then((sb) => sb.auth.getUser())
      .then(({ data }) => setUser(data.user ? { id: data.user.id, email: data.user.email } : null))
      .catch(() => undefined);
  }, [configured]);

  if (!configured)
    return (
      <section className="card">
        <h2>Sincronización (opcional)</h2>
        <p className="small muted">
          No está activada. Seoulmate funciona completo sin servidor. Si querés sincronizar entre dispositivos, seguí la guía de
          Supabase del README (requiere crear un proyecto y configurar dos variables al compilar).
        </p>
      </section>
    );

  const auth = async (mode: 'in' | 'up') => {
    setBusy(true);
    setMsg('');
    try {
      const sb = await getSupabase();
      const res = mode === 'in' ? await sb.auth.signInWithPassword({ email, password }) : await sb.auth.signUp({ email, password });
      if (res.error) throw new Error(res.error.message);
      if (res.data.user && res.data.session) setUser({ id: res.data.user.id, email: res.data.user.email });
      else setMsg('Revisá tu correo para confirmar la cuenta y después iniciá sesión.');
      setPassword('');
    } catch (err) {
      setMsg(errorMessage(err));
    }
    setBusy(false);
  };

  const run = async () => {
    if (!user) return;
    setBusy(true);
    setMsg('');
    try {
      const r = await syncNow(supabaseRemote(await getSupabase(), user.id), syncPass);
      setMsg(`Listo: ${r.pushed} subidos, ${r.pulled} descargados.`);
    } catch (err) {
      setMsg(errorMessage(err));
    }
    setBusy(false);
  };

  return (
    <section className="card">
      <h2>Sincronización (Supabase)</h2>
      <p className="small muted">
        Los datos se cifran en el teléfono con tu contraseña de sincronización antes de subirse: el servidor solo guarda texto cifrado,
        y cada cuenta solo puede leer sus propias filas.
      </p>
      {!user ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            auth('in');
          }}
          noValidate
        >
          <Field label="Correo">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </Field>
          <Field label="Contraseña de la cuenta">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </Field>
          <div className="row">
            <button className="btn sm grow" disabled={busy}>
              Iniciar sesión
            </button>
            <button type="button" className="btn sm secondary grow" disabled={busy} onClick={() => auth('up')}>
              Crear cuenta
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className="small">Sesión iniciada como {user.email}</p>
          <Field label="Contraseña de sincronización" help="Mínimo 8 caracteres. Usá la misma en todos tus dispositivos.">
            <input type="password" value={syncPass} onChange={(e) => setSyncPass(e.target.value)} />
          </Field>
          <div className="row">
            <button className="btn sm grow" onClick={run} disabled={busy || syncPass.length < 8}>
              {busy ? 'Sincronizando…' : 'Sincronizar ahora'}
            </button>
            <button
              className="btn sm secondary"
              onClick={async () => {
                await (await getSupabase()).auth.signOut();
                setUser(null);
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </>
      )}
      {msg && (
        <p className="small" role="status" style={{ marginTop: 10 }}>
          {msg}
        </p>
      )}
    </section>
  );
}

function AppVersion() {
  const [busy, setBusy] = useState(false);
  const check = async () => {
    setBusy(true);
    await checkForUpdate();
    setBusy(false);
    toast('Si había una versión nueva, la app se va a recargar sola.');
  };
  return (
    <section className="card">
      <h2>Versión de la app</h2>
      <p className="small muted" data-testid="build-id">Versión del {BUILD_ID} (UTC)</p>
      <button className="btn ghost sm" onClick={check} disabled={busy} type="button">
        {busy ? 'Buscando…' : 'Buscar actualización'}
      </button>
    </section>
  );
}

function Danger() {
  const [txt, setTxt] = useState('');
  return (
    <section className="card">
      <h2>Borrar todo</h2>
      <p className="small muted">Elimina todos los datos de este dispositivo. No se puede deshacer.</p>
      <Field label='Escribí "BORRAR" para habilitar'>
        <input value={txt} onChange={(e) => setTxt(e.target.value)} />
      </Field>
      <button className="btn danger sm" disabled={txt !== 'BORRAR'} onClick={() => wipeEverything()}>
        Borrar todo
      </button>
    </section>
  );
}
