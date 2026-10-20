// Diario privado y organización personal: documento separado del contenido romántico.
import { useMemo, useState, type FormEvent } from 'react';
import { useDoc, upsert, removeById, newId } from '../lib/store';
import { personalDoc, petDoc } from '../lib/docs';
import { validate, hasErrors } from '../lib/validation';
import { formatKey, todayKey } from '../lib/dates';
import { rewardTask } from '../lib/pet';
import type { DiaryEntry, Goal, Task } from '../lib/types';
import { Bar, DeleteButton, Empty, Field, FormActions, Modal, Tabs, toast, useForm } from '../components/ui';
import { IconEdit } from '../components/icons';

type PTab = 'diario' | 'tareas' | 'objetivos';
const MOODS = ['😊', '🥰', '😌', '✨', '😴', '😢', '😤'];

export function PersonalPage() {
  const [tab, setTab] = useState<PTab>('diario');
  return (
    <div className="page">
      <p className="small muted" style={{ marginTop: 0 }}>
        🔐 Solo para vos. Este espacio está separado de "Nuestro capítulo" y nunca se incluye en los paquetes que se comparten.
      </p>
      <Tabs<PTab>
        label="Diario y organización"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'diario', label: 'Diario' },
          { id: 'tareas', label: 'Tareas' },
          { id: 'objetivos', label: 'Objetivos' },
        ]}
      />
      {tab === 'diario' && <Diary />}
      {tab === 'tareas' && <Tasks />}
      {tab === 'objetivos' && <Goals />}
    </div>
  );
}

const upd = (fn: (p: ReturnType<typeof personalDoc.get>) => ReturnType<typeof personalDoc.get>) => personalDoc.update(fn);

// ---------- diario ----------
function Diary() {
  const { diary } = useDoc(personalDoc);
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<DiaryEntry | 'new' | null>(null);
  const [view, setView] = useState<DiaryEntry | null>(null);
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return [...diary]
      .filter((d) => !t || d.title.toLowerCase().includes(t) || d.body.toLowerCase().includes(t))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  }, [diary, q]);
  return (
    <div>
      <div className="row" style={{ marginBottom: 10 }}>
        <input className="input grow" placeholder="Buscar en el diario…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar en el diario" />
        <button className="btn" onClick={() => setEdit('new')}>
          + Escribir
        </button>
      </div>
      {diary.length === 0 ? (
        <Empty title="Tu diario está en blanco" text="Contá cómo fue tu día, lo que sentiste o lo que querés recordar." />
      ) : shown.length === 0 ? (
        <Empty title="Sin resultados" />
      ) : (
        shown.map((d) => (
          <button key={d.id} className="item" style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }} onClick={() => setView(d)} data-testid="diary-entry">
            <div className="date-pill" style={{ fontSize: '0.75rem', fontWeight: 700, background: 'var(--butter-soft)', borderRadius: 10, padding: '6px 8px', minWidth: 74, textAlign: 'center' }}>
              {formatKey(d.date)}
            </div>
            <div className="grow">
              <div className="title">
                {d.mood} {d.title || 'Sin título'}
              </div>
              <div className="small muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {d.body}
              </div>
            </div>
          </button>
        ))
      )}
      {view && (
        <Modal title={view.title || formatKey(view.date)} onClose={() => setView(null)}>
          <p className="small muted">
            {formatKey(view.date)} {view.mood}
          </p>
          <article className="card">
            <p className="pre serif" style={{ margin: 0 }} data-testid="diary-body">
              {view.body}
            </p>
          </article>
          <button className="btn block secondary" onClick={() => (setEdit(view), setView(null))}>
            Editar
          </button>
        </Modal>
      )}
      {edit && <DiaryForm entry={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

function DiaryForm({ entry, onClose }: { entry: DiaryEntry | null; onClose: () => void }) {
  const f = useForm({ date: entry?.date ?? todayKey(), title: entry?.title ?? '', body: entry?.body ?? '', mood: entry?.mood ?? '' });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(f.values, {
      date: { label: 'La fecha', required: true, date: true },
      title: { label: 'Título', max: 120 },
      body: { label: 'El texto', required: true, max: 20000 },
    });
    f.setErrors(errs);
    if (hasErrors(errs)) return;
    const now = Date.now();
    await upd((p) => ({
      ...p,
      diary: upsert(p.diary, { id: entry?.id ?? newId(), createdAt: entry?.createdAt ?? now, updatedAt: now, ...f.values, title: f.values.title.trim() }),
    }));
    toast(entry ? 'Entrada actualizada' : 'Guardado en tu diario 📖');
    onClose();
  };
  return (
    <Modal title={entry ? 'Editar entrada' : 'Nueva entrada'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <Field label="Fecha" error={f.errors.date}>
          <input type="date" value={f.values.date} onChange={(e) => f.set('date')(e.target.value)} />
        </Field>
        <div className="field">
          <span className="field-label">¿Cómo te sentís?</span>
          <div className="chips">
            {MOODS.map((m) => (
              <button key={m} type="button" className="chip" aria-pressed={f.values.mood === m} onClick={() => f.set('mood')(f.values.mood === m ? '' : m)} style={{ fontSize: '1.2rem' }}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <Field label="Título (opcional)" error={f.errors.title}>
          <input value={f.values.title} onChange={(e) => f.set('title')(e.target.value)} />
        </Field>
        <Field label="Querido diario…" error={f.errors.body}>
          <textarea value={f.values.body} onChange={(e) => f.set('body')(e.target.value)} style={{ minHeight: 180 }} />
        </Field>
        <FormActions onCancel={onClose} />
        {entry && (
          <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}>
            <DeleteButton
              onConfirm={async () => {
                await upd((p) => ({ ...p, diary: removeById(p.diary, entry.id) }));
                onClose();
              }}
            />
          </div>
        )}
      </form>
    </Modal>
  );
}

// ---------- tareas ----------
function Tasks() {
  const { tasks } = useDoc(personalDoc);
  const [text, setText] = useState('');
  const [due, setDue] = useState('');
  const [err, setErr] = useState('');
  const [edit, setEdit] = useState<Task | null>(null);
  const pending = tasks.filter((t) => !t.done).sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'));
  const done = tasks.filter((t) => t.done).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
  const add = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate({ text, due }, { text: { label: 'La tarea', required: true, max: 200 }, due: { label: 'Fecha', date: true } });
    if (hasErrors(errs)) return setErr(Object.values(errs)[0]);
    await upd((p) => ({ ...p, tasks: [{ id: newId(), text: text.trim(), due: due || null, done: false, doneAt: null, createdAt: Date.now() }, ...p.tasks] }));
    setText('');
    setDue('');
    setErr('');
  };
  const toggle = async (t: Task) => {
    const nowDone = !t.done;
    await upd((p) => ({ ...p, tasks: upsert(p.tasks, { ...t, done: nowDone, doneAt: nowDone ? Date.now() : null }) }));
    if (nowDone) {
      const pet = petDoc.get();
      if (pet.adopted) {
        const r = rewardTask(pet, t.id);
        if (r.hearts) {
          await petDoc.replace(r.state);
          toast(`¡Bien hecho! +${r.hearts} 💗 para ${pet.name}`);
        }
      }
    }
  };
  const today = todayKey();
  return (
    <div>
      <form className="card soft" onSubmit={add} noValidate>
        <Field label="Nueva tarea" error={err}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="¿Qué tenés que hacer?" />
        </Field>
        <div className="row">
          <label className="field grow" style={{ marginBottom: 0 }}>
            <span className="field-label">Para el (opcional)</span>
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </label>
          <button className="btn" style={{ alignSelf: 'flex-end' }}>
            Agregar
          </button>
        </div>
      </form>
      {tasks.length === 0 && <Empty title="Sin tareas" text="Al completarlas, tu gatito gana corazones." />}
      {pending.map((t) => (
        <TaskRow key={t.id} t={t} onToggle={() => toggle(t)} onEdit={() => setEdit(t)} overdue={!!t.due && t.due < today} />
      ))}
      {done.length > 0 && <h3 style={{ marginTop: 16 }}>Hechas ({done.length})</h3>}
      {done.map((t) => (
        <TaskRow key={t.id} t={t} onToggle={() => toggle(t)} onEdit={() => setEdit(t)} />
      ))}
      {edit && <TaskForm task={edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

function TaskRow({ t, onToggle, onEdit, overdue }: { t: Task; onToggle: () => void; onEdit: () => void; overdue?: boolean }) {
  return (
    <div className="item" style={{ alignItems: 'center', opacity: t.done ? 0.7 : 1 }} data-testid="task">
      <label className="check grow" style={{ minWidth: 0 }}>
        <input type="checkbox" checked={t.done} onChange={onToggle} aria-label={`Completar: ${t.text}`} />
        <span style={{ textDecoration: t.done ? 'line-through' : 'none', wordBreak: 'break-word' }}>{t.text}</span>
      </label>
      {t.due && <span className={`tag ${overdue ? 'rose' : 'butter'}`}>{formatKey(t.due)}</span>}
      <button className="iconbtn" aria-label="Editar tarea" onClick={onEdit}>
        <IconEdit />
      </button>
    </div>
  );
}

function TaskForm({ task, onClose }: { task: Task; onClose: () => void }) {
  const f = useForm({ text: task.text, due: task.due ?? '' });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(f.values, { text: { label: 'La tarea', required: true, max: 200 }, due: { label: 'Fecha', date: true } });
    f.setErrors(errs);
    if (hasErrors(errs)) return;
    await upd((p) => ({ ...p, tasks: upsert(p.tasks, { ...task, text: f.values.text.trim(), due: f.values.due || null }) }));
    onClose();
  };
  return (
    <Modal title="Editar tarea" onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <Field label="Tarea" error={f.errors.text}>
          <input value={f.values.text} onChange={(e) => f.set('text')(e.target.value)} />
        </Field>
        <Field label="Para el (opcional)" error={f.errors.due}>
          <input type="date" value={f.values.due} onChange={(e) => f.set('due')(e.target.value)} />
        </Field>
        <FormActions onCancel={onClose} />
        <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}>
          <DeleteButton
            onConfirm={async () => {
              await upd((p) => ({ ...p, tasks: removeById(p.tasks, task.id) }));
              onClose();
            }}
          />
        </div>
      </form>
    </Modal>
  );
}

// ---------- objetivos ----------
function Goals() {
  const { goals } = useDoc(personalDoc);
  const [edit, setEdit] = useState<Goal | 'new' | null>(null);
  const step = (g: Goal, d: number) => upd((p) => ({ ...p, goals: upsert(p.goals, { ...g, progress: Math.max(0, Math.min(100, g.progress + d)) }) }));
  return (
    <div>
      <button className="btn block" style={{ marginBottom: 12 }} onClick={() => setEdit('new')}>
        + Nuevo objetivo
      </button>
      {goals.length === 0 ? (
        <Empty title="Sin objetivos todavía" text="Sueños grandes o pequeños: anotalos y seguí tu progreso." />
      ) : (
        goals.map((g) => (
          <div className="card" key={g.id} data-testid="goal">
            <div className="row spread">
              <h3 style={{ margin: 0 }}>
                {g.progress >= 100 ? '🏆 ' : ''}
                {g.title}
              </h3>
              <button className="iconbtn" aria-label="Editar objetivo" onClick={() => setEdit(g)}>
                <IconEdit />
              </button>
            </div>
            {g.note && <p className="small pre">{g.note}</p>}
            {g.targetDate && <p className="tiny muted">Meta: {formatKey(g.targetDate)}</p>}
            <div className="row">
              <button className="btn secondary sm" onClick={() => step(g, -10)} aria-label="Restar 10%">
                −
              </button>
              <div className="grow">
                <Bar value={g.progress} tone="rose" label={`Progreso de ${g.title}`} />
              </div>
              <button className="btn secondary sm" onClick={() => step(g, 10)} aria-label="Sumar 10%">
                +
              </button>
              <span className="small" style={{ width: 42, textAlign: 'right', fontWeight: 700 }}>
                {g.progress}%
              </span>
            </div>
          </div>
        ))
      )}
      {edit && <GoalForm goal={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

function GoalForm({ goal, onClose }: { goal: Goal | null; onClose: () => void }) {
  const f = useForm({ title: goal?.title ?? '', note: goal?.note ?? '', progress: goal?.progress ?? 0, targetDate: goal?.targetDate ?? '' });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(f.values, {
      title: { label: 'El objetivo', required: true, max: 120 },
      note: { label: 'Nota', max: 2000 },
      progress: { label: 'Progreso', min: 0, maxNum: 100 },
      targetDate: { label: 'Fecha', date: true },
    });
    f.setErrors(errs);
    if (hasErrors(errs)) return;
    await upd((p) => ({
      ...p,
      goals: upsert(p.goals, {
        id: goal?.id ?? newId(),
        createdAt: goal?.createdAt ?? Date.now(),
        ...f.values,
        title: f.values.title.trim(),
        targetDate: f.values.targetDate || null,
      }),
    }));
    onClose();
  };
  return (
    <Modal title={goal ? 'Editar objetivo' : 'Nuevo objetivo'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <Field label="Objetivo" error={f.errors.title}>
          <input value={f.values.title} onChange={(e) => f.set('title')(e.target.value)} />
        </Field>
        <Field label="Nota (opcional)" error={f.errors.note}>
          <textarea value={f.values.note} onChange={(e) => f.set('note')(e.target.value)} />
        </Field>
        <Field label={`Progreso: ${f.values.progress}%`} error={f.errors.progress}>
          <input type="range" min={0} max={100} step={5} value={f.values.progress} onChange={(e) => f.set('progress')(Number(e.target.value))} style={{ width: '100%' }} />
        </Field>
        <Field label="Fecha meta (opcional)" error={f.errors.targetDate}>
          <input type="date" value={f.values.targetDate} onChange={(e) => f.set('targetDate')(e.target.value)} />
        </Field>
        <FormActions onCancel={onClose} />
        {goal && (
          <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}>
            <DeleteButton
              onConfirm={async () => {
                await upd((p) => ({ ...p, goals: removeById(p.goals, goal.id) }));
                onClose();
              }}
            />
          </div>
        )}
      </form>
    </Modal>
  );
}
