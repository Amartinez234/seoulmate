// Actualizaciones de la app instalada: en iPhone la app vuelve del segundo plano sin recargar,
// así que buscamos versión nueva al registrarse, al volver a la app y cada 30 minutos.
// Con registerType 'autoUpdate' la página se recarga sola cuando el service worker nuevo toma el control.
import { registerSW } from 'virtual:pwa-register';

export const BUILD_ID = __BUILD_ID__;

let registration: ServiceWorkerRegistration | undefined;

export async function checkForUpdate(): Promise<void> {
  if (!registration || !navigator.onLine) return;
  try {
    await registration.update();
  } catch {
    // Sin conexión o servidor caído: se reintenta la próxima vez.
  }
}

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, r) {
      registration = r;
      void checkForUpdate();
      setInterval(() => void checkForUpdate(), 30 * 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void checkForUpdate();
      });
    },
  });
}
