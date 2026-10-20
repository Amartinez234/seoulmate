import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconCamera, IconStar, IconTrash } from './icons';
import { SleepyCat } from './deco';
import { saveImageFile, useMedia } from '../lib/media';

// ---------- toasts ----------
type ToastItem = { id: number; text: string; kind: 'info' | 'error' };
let toasts: ToastItem[] = [];
let toastSeq = 0;
const toastListeners = new Set<() => void>();
const emitToasts = () => toastListeners.forEach((l) => l());

export function toast(text: string, kind: 'info' | 'error' = 'info'): void {
  const id = ++toastSeq;
  toasts = [...toasts, { id, text, kind }];
  emitToasts();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emitToasts();
  }, 3200);
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Algo salió mal. Probá de nuevo.';
}

export function Toasts() {
  const list = useSyncExternalStore(
    (fn) => {
      toastListeners.add(fn);
      return () => toastListeners.delete(fn);
    },
    () => toasts,
  );
  return (
    <div className="toasts" role="status" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className={`toast ${t.kind === 'error' ? 'error' : ''}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}

// ---------- modal ----------
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector<HTMLElement>('input, textarea, select')?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return createPortal(
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="grab" />
        <div className="row spread" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button className="btn ghost sm" onClick={onClose} type="button">
            Cerrar
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

// ---------- campos ----------
export function Field({
  label,
  error,
  help,
  children,
}: {
  label: string;
  error?: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <div className={`field ${error ? 'invalid' : ''}`}>
      <label>
        <span className="field-label">{label}</span>
        {children}
      </label>
      {error ? (
        <em className="err" role="alert">
          {error}
        </em>
      ) : help ? (
        <em className="help">{help}</em>
      ) : null}
    </div>
  );
}

export function useForm<T extends Record<string, unknown>>(initial: T) {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set =
    <K extends keyof T>(k: K) =>
    (v: T[K]) => {
      setValues((s) => ({ ...s, [k]: v }));
      setErrors((e) => {
        if (!e[k as string]) return e;
        const c = { ...e };
        delete c[k as string];
        return c;
      });
    };
  return { values, set, errors, setErrors, setValues };
}

export function FormActions({ onCancel, saving, label = 'Guardar' }: { onCancel: () => void; saving?: boolean; label?: string }) {
  return (
    <div className="row" style={{ marginTop: 8 }}>
      <button type="button" className="btn secondary grow" onClick={onCancel}>
        Cancelar
      </button>
      <button type="submit" className="btn grow" disabled={saving}>
        {saving ? 'Guardando…' : label}
      </button>
    </div>
  );
}

// ---------- estados vacíos ----------
export function Empty({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <SleepyCat />
      <h3>{title}</h3>
      {text && <p className="small">{text}</p>}
      {action}
    </div>
  );
}

// ---------- estrellas ----------
export function Stars({ value, onChange, label = 'Puntuación' }: { value: number; onChange?: (v: number) => void; label?: string }) {
  if (!onChange) {
    return (
      <span className="stars readonly" aria-label={`${value} de 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= value ? 'on' : ''} style={{ color: n <= value ? '#e9c35a' : 'var(--silver)' }}>
            <IconStar filled={n <= value} />
          </span>
        ))}
      </span>
    );
  }
  return (
    <span className="stars" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
          className={n <= value ? 'on' : ''}
          onClick={() => onChange(value === n ? 0 : n)}
        >
          <IconStar filled={n <= value} />
        </button>
      ))}
    </span>
  );
}

// ---------- pestañas ----------
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: Array<{ id: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button key={t.id} role="tab" type="button" className="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Chips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="chips">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            className="chip"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

// ---------- eliminar con confirmación ----------
export function DeleteButton({ onConfirm, label = 'Eliminar' }: { onConfirm: () => void; label?: string }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3500);
    return () => clearTimeout(t);
  }, [armed]);
  return armed ? (
    <button type="button" className="btn danger sm" onClick={onConfirm}>
      ¿Seguro? Eliminar
    </button>
  ) : (
    <button type="button" className="iconbtn" aria-label={label} title={label} onClick={() => setArmed(true)}>
      <IconTrash />
    </button>
  );
}

// ---------- imágenes ----------
export function MediaImg({ id, alt, className, style }: { id: string | null | undefined; alt: string; className?: string; style?: React.CSSProperties }) {
  const url = useMedia(id);
  if (!id) return null;
  if (url === undefined) return <div className={className} style={{ ...style, background: 'var(--lavender-mist)' }} aria-busy="true" />;
  if (url === null) return <div className={className} style={{ ...style, background: 'var(--lavender-mist)' }} title="Imagen no disponible" />;
  return <img src={url} alt={alt} className={className} style={style} />;
}

export function ImagePicker({
  value,
  onChange,
  label = 'Imagen',
  required,
  error,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  label?: string;
  required?: boolean;
  error?: string;
}) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try {
      onChange(await saveImageFile(f));
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };
  return (
    <div className={`field ${error ? 'invalid' : ''}`}>
      <span className="field-label">
        {label}
        {required ? '' : ' (opcional)'}
      </span>
      <div className="row">
        {value ? <MediaImg id={value} alt="Vista previa" className="thumb" /> : null}
        <button type="button" className="btn secondary sm" onClick={() => inputRef.current?.click()} disabled={busy}>
          <IconCamera width={18} height={18} /> {busy ? 'Procesando…' : value ? 'Cambiar' : 'Elegir imagen'}
        </button>
        {value && !required && (
          <button type="button" className="btn ghost sm" onClick={() => onChange(null)}>
            Quitar
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          aria-label={label}
          data-testid="image-input"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>
      {error && <em className="err">{error}</em>}
    </div>
  );
}

export function Bar({ value, tone, label }: { value: number; tone?: 'rose' | 'butter'; label: string }) {
  return (
    <div className={`bar ${tone ?? ''}`} role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function PageHeaderAction({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button className="btn sm" onClick={onClick} type="button">
      + {label}
    </button>
  );
}
