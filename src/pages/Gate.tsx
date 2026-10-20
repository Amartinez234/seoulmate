// Pantallas de primera configuración y de desbloqueo.
import { useEffect, useState, type FormEvent } from 'react';
import { createVault, MIN_PASSPHRASE, unlockDelayMs, unlockVault, validatePassphrase, wipeEverything } from '../lib/vault';
import { loadAllDocs } from '../lib/store';
import { settingsDoc } from '../lib/docs';
import { Cat } from '../components/Cat';
import { Blossom, HeartDeco, Star4 } from '../components/deco';
import { Field } from '../components/ui';
import './gate.css';

function Hero({ subtitle }: { subtitle: string }) {
  return (
    <div className="gate-hero">
      <Star4 size={18} style={{ position: 'absolute', left: '18%', top: 18 }} />
      <Blossom size={26} style={{ position: 'absolute', right: '16%', top: 30 }} />
      <HeartDeco size={16} style={{ position: 'absolute', left: '26%', bottom: 26 }} />
      <Cat breed="crema" accessory="flor-cerezo" size={150} title="Gatito de bienvenida" />
      <h1 className="gate-title">Seoulmate</h1>
      <p className="muted">{subtitle}</p>
    </div>
  );
}

export function SetupScreen({ onDone }: { onDone: () => Promise<void> }) {
  const [nickname, setNickname] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!nickname.trim()) errs.nickname = 'Decinos cómo querés que te saludemos.';
    else if (nickname.trim().length > 30) errs.nickname = 'Máximo 30 caracteres.';
    const pe = validatePassphrase(pass);
    if (pe) errs.pass = pe;
    if (pass !== pass2) errs.pass2 = 'Las contraseñas no coinciden.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await createVault(pass);
      await loadAllDocs();
      await settingsDoc.update((s) => ({ ...s, nickname: nickname.trim(), onboarded: true }));
      await onDone();
    } catch (err) {
      setErrors({ pass: err instanceof Error ? err.message : 'No se pudo crear.' });
      setBusy(false);
    }
  };

  return (
    <div className="gate">
      <Hero subtitle="Un rincón privado hecho especialmente para vos." />
      <form className="card tape" onSubmit={submit} noValidate>
        <h2>Bienvenida 💜</h2>
        <Field label="¿Cómo querés que te llame?" error={errors.nickname}>
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Tu nombre o apodo" maxLength={40} autoComplete="nickname" />
        </Field>
        <Field
          label="Creá una contraseña"
          error={errors.pass}
          help={`Mínimo ${MIN_PASSPHRASE} caracteres. Protege y cifra todo lo que guardes aquí.`}
        >
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="new-password" />
        </Field>
        <Field label="Repetí la contraseña" error={errors.pass2}>
          <input type="password" value={pass2} onChange={(e) => setPass2(e.target.value)} autoComplete="new-password" />
        </Field>
        <p className="small muted">
          Importante: la contraseña no se puede recuperar. Si la olvidás, solo podrás empezar de cero o restaurar una copia de
          seguridad.
        </p>
        <button className="btn block" disabled={busy}>
          {busy ? 'Preparando tu rincón…' : 'Empezar'}
        </button>
      </form>
    </div>
  );
}

export function LockScreen({ onUnlocked }: { onUnlocked: () => Promise<void> }) {
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const [forgot, setForgot] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState('');

  useEffect(() => {
    unlockDelayMs().then(setWait);
  }, []);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => Math.max(0, w - 1000)), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!pass || busy || wait > 0) return;
    setBusy(true);
    setError('');
    try {
      if (await unlockVault(pass)) {
        await onUnlocked();
        return;
      }
      setError('Contraseña incorrecta.');
      setWait(await unlockDelayMs());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo desbloquear.');
    }
    setBusy(false);
  };

  return (
    <div className="gate">
      <Hero subtitle="Tu gatito te está esperando." />
      <form className="card tape" onSubmit={submit}>
        <Field label="Contraseña" error={error}>
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" autoFocus />
        </Field>
        <button className="btn block" disabled={busy || wait > 0}>
          {busy ? 'Abriendo…' : wait > 0 ? `Esperá ${Math.ceil(wait / 1000)} s` : 'Desbloquear'}
        </button>
        <button type="button" className="btn ghost block" onClick={() => setForgot((f) => !f)} style={{ marginTop: 6 }}>
          ¿Olvidaste la contraseña?
        </button>
        {forgot && (
          <div className="card soft" style={{ marginTop: 10 }}>
            <p className="small">
              Por seguridad, los datos están cifrados con tu contraseña y nadie puede recuperarlos sin ella. Podés borrar todo y
              empezar de nuevo (y luego restaurar una copia de seguridad si tenés una).
            </p>
            <Field label='Escribí "BORRAR" para confirmar'>
              <input value={confirmWipe} onChange={(e) => setConfirmWipe(e.target.value)} />
            </Field>
            <button type="button" className="btn danger block" disabled={confirmWipe !== 'BORRAR'} onClick={() => wipeEverything()}>
              Borrar todo y empezar de nuevo
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
