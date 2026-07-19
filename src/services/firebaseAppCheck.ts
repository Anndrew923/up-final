import { FirebaseAppCheck } from '@capacitor-firebase/app-check';
import { isCapacitorNativePlatform } from '../lib/capacitorPlatform';
import {
  CustomProvider,
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from 'firebase/app-check';
import type { FirebaseApp } from 'firebase/app';
import { isFirebaseEmulatorEnabled } from '../config/firebaseEmulator';

let initialized = false;

function trimEnv(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

function configureWebDebugToken(): void {
  if (!import.meta.env.DEV) return;
  const configured = trimEnv(import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN);
  const target = globalThis as typeof globalThis & {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
  };
  target.FIREBASE_APPCHECK_DEBUG_TOKEN = configured || true;
}

/**
 * Bridges native Play Integrity / DeviceCheck into the Firebase JS SDK used by
 * Callable Functions. Without this custom provider, native attestation exists
 * only in the Capacitor layer and `httpsCallable` sends no App Check token.
 */
export function initializeFirebaseAppCheck(app: FirebaseApp): boolean {
  if (initialized || isFirebaseEmulatorEnabled()) return true;

  if (isCapacitorNativePlatform()) {
    const nativeReady = FirebaseAppCheck.initialize({
      isTokenAutoRefreshEnabled: true,
    });
    const provider = new CustomProvider({
      getToken: async () => {
        await nativeReady;
        const result = await FirebaseAppCheck.getToken({ forceRefresh: false });
        return {
          token: result.token,
          // Native SDK normally supplies expiry; use a conservative refresh window if omitted.
          expireTimeMillis: result.expireTimeMillis ?? Date.now() + 30 * 60 * 1000,
        };
      },
    });
    initializeAppCheck(app, {
      provider,
      isTokenAutoRefreshEnabled: true,
    });
    initialized = true;
    return true;
  }

  const siteKey = trimEnv(import.meta.env.VITE_APP_CHECK_SITE_KEY);
  if (!siteKey) {
    if (import.meta.env.DEV) {
      console.warn('[app-check] VITE_APP_CHECK_SITE_KEY is missing; protected calls will fail.');
    }
    return false;
  }

  configureWebDebugToken();
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
  initialized = true;
  return true;
}
