import { useCallback, useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { isVaultSetUp, lockVault, onLock } from './lib/vault';
import { loadAllDocs, onSaveError, resetAllDocs } from './lib/store';
import { clearMediaCache } from './lib/media';
import { setAuthorMode } from './lib/session';
import { petDoc, settingsDoc } from './lib/docs';
import { claimVisit } from './lib/pet';
import { stopPlayer } from './lib/player';
import { Toasts, toast } from './components/ui';
import { Layout } from './components/Layout';
import { LockScreen, SetupScreen } from './pages/Gate';
import { HomePage } from './pages/Home';
import { BtsPage } from './pages/Bts';
import { DramasPage } from './pages/Dramas';
import { CatCafePage } from './pages/CatCafe';
import { ChapterPage } from './pages/Chapter';
import { PersonalPage } from './pages/Personal';
import { SettingsPage } from './pages/Settings';
import { StoriesPage } from './pages/Stories';

type Phase = 'loading' | 'setup' | 'locked' | 'unlocked' | 'error';

export function App() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [visitGift, setVisitGift] = useState<string | null>(null);

  useEffect(() => {
    isVaultSetUp()
      .then((ok) => setPhase(ok ? 'locked' : 'setup'))
      .catch(() => setPhase('error'));
    // Pide al navegador que no borre los datos locales por falta de espacio.
    navigator.storage?.persist?.().catch(() => undefined);
    const offLock = onLock(() => {
      resetAllDocs();
      clearMediaCache();
      setAuthorMode(false);
      stopPlayer();
      isVaultSetUp().then((ok) => setPhase(ok ? 'locked' : 'setup'));
    });
    const offErr = onSaveError((e) => toast(`No se pudo guardar: ${e instanceof Error ? e.message : 'error desconocido'}`, 'error'));
    return () => {
      offLock();
      offErr();
    };
  }, []);

  const afterUnlock = useCallback(async () => {
    await loadAllDocs();
    const pet = petDoc.get();
    if (pet.adopted) {
      const r = claimVisit(pet);
      if (r.hearts > 0) {
        await petDoc.replace(r.state);
        setVisitGift(r.message);
      } else if (r.state !== pet) await petDoc.replace(r.state);
    }
    setPhase('unlocked');
  }, []);

  useAutoLock(phase === 'unlocked');

  if (phase === 'loading') return <div className="spinner" aria-label="Cargando" />;
  if (phase === 'error')
    return (
      <div className="page center">
        <h1>No se pudo abrir el almacenamiento</h1>
        <p>Este navegador no permite guardar datos (¿modo privado?). Abrí Seoulmate en una ventana normal.</p>
      </div>
    );
  if (phase === 'setup') return <SetupScreen onDone={afterUnlock} />;
  if (phase === 'locked') return <LockScreen onUnlocked={afterUnlock} />;

  return (
    <HashRouter>
      <Toasts />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage visitGift={visitGift} onGiftSeen={() => setVisitGift(null)} />} />
          <Route path="bts" element={<BtsPage />} />
          <Route path="dramas" element={<DramasPage />} />
          <Route path="gatito" element={<CatCafePage />} />
          <Route path="nosotros" element={<ChapterPage />} />
          <Route path="diario" element={<PersonalPage />} />
          <Route path="historias" element={<StoriesPage />} />
          <Route path="ajustes" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

/** Bloquea la app tras X minutos sin actividad o en segundo plano. */
function useAutoLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    let last = Date.now();
    let hiddenAt: number | null = null;
    const limit = () => Math.max(1, settingsDoc.get().autoLockMinutes) * 60_000;
    const touch = () => (last = Date.now());
    const onVis = () => {
      if (document.hidden) hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > limit()) lockVault();
      else touch();
    };
    const iv = setInterval(() => {
      if (!document.hidden && Date.now() - last > limit()) lockVault();
    }, 15_000);
    window.addEventListener('pointerdown', touch);
    window.addEventListener('keydown', touch);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(iv);
      window.removeEventListener('pointerdown', touch);
      window.removeEventListener('keydown', touch);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [active]);
}
