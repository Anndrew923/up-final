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

/** Debounce window for native bridge getToken — avoids burst after app foreground (e.g. photo picker). */
const NATIVE_TOKEN_DEBOUNCE_MS = 10_000;
/** Hard cooldown: never pierce native bridge twice within this window unless forceRefresh. */
const NATIVE_BRIDGE_COOLDOWN_MS = 3_000;
/** Do not reuse cache when token expires within this window. */
const MIN_REMAINING_BEFORE_EXPIRY_MS = 60_000;
const DEFAULT_TOKEN_TTL_MS = 30 * 60 * 1000;

type CachedNativeToken = {
  token: string;
  expireTimeMillis: number;
  fetchedAtMs: number;
};

let cachedNativeToken: CachedNativeToken | null = null;
let nativeReadyPromise: Promise<void> = Promise.resolve();
let inFlightNativeToken: Promise<CachedNativeToken> | null = null;
let lastNativeBridgeCallMs = 0;

function trimEnv(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Native plugins may return seconds instead of ms, or omit expiry entirely.
 * WHY: Malformed expiry makes Firebase JS SDK treat tokens as instantly expired → getToken spam.
 */
export function normalizeExpireTimeMillis(raw: number | undefined): number {
  const now = Date.now();
  if (raw == null || !Number.isFinite(raw)) return now + DEFAULT_TOKEN_TTL_MS;
  const ms = raw < 1e12 ? raw * 1000 : raw;
  return ms > now ? ms : now + DEFAULT_TOKEN_TTL_MS;
}

function configureWebDebugToken(): void {
  if (!import.meta.env.DEV) return;
  const configured = trimEnv(import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN);
  const target = globalThis as typeof globalThis & {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
  };
  target.FIREBASE_APPCHECK_DEBUG_TOKEN = configured || true;
}

async function fetchNativeAppCheckToken(forceRefresh: boolean): Promise<CachedNativeToken> {
  await nativeReadyPromise;

  const now = Date.now();

  if (
    !forceRefresh &&
    cachedNativeToken &&
    lastNativeBridgeCallMs > 0 &&
    now - lastNativeBridgeCallMs < NATIVE_BRIDGE_COOLDOWN_MS &&
    cachedNativeToken.expireTimeMillis - now > MIN_REMAINING_BEFORE_EXPIRY_MS
  ) {
    return cachedNativeToken;
  }

  if (!forceRefresh && cachedNativeToken) {
    const age = now - cachedNativeToken.fetchedAtMs;
    const remaining = cachedNativeToken.expireTimeMillis - now;
    if (age < NATIVE_TOKEN_DEBOUNCE_MS && remaining > MIN_REMAINING_BEFORE_EXPIRY_MS) {
      return cachedNativeToken;
    }
  }

  if (!forceRefresh && inFlightNativeToken) {
    return inFlightNativeToken;
  }

  const fetchTask = (async (): Promise<CachedNativeToken> => {
    lastNativeBridgeCallMs = Date.now();
    const result = await FirebaseAppCheck.getToken({ forceRefresh });
    const fetchedAtMs = Date.now();
    cachedNativeToken = {
      token: result.token,
      expireTimeMillis: normalizeExpireTimeMillis(result.expireTimeMillis),
      fetchedAtMs,
    };
    return cachedNativeToken;
  })();

  if (!forceRefresh) {
    inFlightNativeToken = fetchTask;
  }

  try {
    return await fetchTask;
  } finally {
    if (!forceRefresh && inFlightNativeToken === fetchTask) {
      inFlightNativeToken = null;
    }
  }
}

/**
 * Bridges native Play Integrity / DeviceCheck into the Firebase JS SDK used by
 * Callable Functions. Without this custom provider, native attestation exists
 * only in the Capacitor layer and `httpsCallable` sends no App Check token.
 */
export function initializeFirebaseAppCheck(app: FirebaseApp): boolean {
  if (initialized || isFirebaseEmulatorEnabled()) return true;

  if (isCapacitorNativePlatform()) {
    nativeReadyPromise = FirebaseAppCheck.initialize({
      isTokenAutoRefreshEnabled: false,
    }).then(() => undefined);
    const provider = new CustomProvider({
      getToken: async () => {
        const cached = await fetchNativeAppCheckToken(false);
        return {
          token: cached.token,
          expireTimeMillis: cached.expireTimeMillis,
        };
      },
    });
    initializeAppCheck(app, {
      provider,
      isTokenAutoRefreshEnabled: false,
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

/**
 * Prefetch / force-refresh attestation before ladder Callables.
 * WHY: First sync after cold start can race native Play Integrity; Functions then reject
 * with bare `unauthenticated` even though Google Auth is healthy.
 */
export async function ensureFreshAppCheckToken(forceRefresh = false): Promise<boolean> {
  if (!initialized || isFirebaseEmulatorEnabled()) return true;
  if (!isCapacitorNativePlatform()) return initialized;

  try {
    await fetchNativeAppCheckToken(forceRefresh);
    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[app-check] native getToken failed', error);
    }
    return false;
  }
}

/** Test-only reset for module cache between vitest cases. */
export function resetNativeAppCheckTokenCacheForTests(): void {
  if (!import.meta.env.VITEST) return;
  cachedNativeToken = null;
  inFlightNativeToken = null;
  lastNativeBridgeCallMs = 0;
  nativeReadyPromise = Promise.resolve();
}
