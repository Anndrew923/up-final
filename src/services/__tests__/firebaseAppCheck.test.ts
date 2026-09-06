import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FirebaseApp } from 'firebase/app';

const mocks = vi.hoisted(() => ({
  native: false,
  emulator: false,
  initializeNative: vi.fn(() => Promise.resolve()),
  getNativeToken: vi.fn(() => Promise.resolve({ token: 'native-token', expireTimeMillis: Date.now() + 3_600_000 })),
  initializeWeb: vi.fn(),
  recaptchaKey: '',
  customOptions: null as { getToken: () => Promise<{ token: string; expireTimeMillis: number }> } | null,
}));

vi.mock('@capacitor-firebase/app-check', () => ({
  FirebaseAppCheck: {
    initialize: mocks.initializeNative,
    getToken: mocks.getNativeToken,
  },
}));

vi.mock('../../lib/capacitorPlatform', () => ({
  isCapacitorNativePlatform: () => mocks.native,
}));

vi.mock('../../config/firebaseEmulator', () => ({
  isFirebaseEmulatorEnabled: () => mocks.emulator,
}));

vi.mock('firebase/app-check', () => ({
  initializeAppCheck: mocks.initializeWeb,
  CustomProvider: class {
    constructor(options: typeof mocks.customOptions) {
      mocks.customOptions = options;
    }
  },
  ReCaptchaEnterpriseProvider: class {
    constructor(key: string) {
      mocks.recaptchaKey = key;
    }
  },
}));

const app = {} as FirebaseApp;

async function loadSubject() {
  vi.resetModules();
  return import('../firebaseAppCheck');
}

describe('Firebase App Check initialization', () => {
  beforeEach(() => {
    mocks.native = false;
    mocks.emulator = false;
    mocks.recaptchaKey = '';
    mocks.customOptions = null;
    mocks.initializeNative.mockClear();
    mocks.getNativeToken.mockClear();
    mocks.initializeWeb.mockClear();
    vi.stubEnv('VITE_APP_CHECK_SITE_KEY', '');
    // WHY: Do not inherit machine `.env` debug UUID — keeps CI logs free of local secrets.
    vi.stubEnv('VITE_APP_CHECK_DEBUG_TOKEN', '');
  });

  it('skips providers for emulator traffic', async () => {
    mocks.emulator = true;
    const { initializeFirebaseAppCheck } = await loadSubject();
    expect(initializeFirebaseAppCheck(app)).toBe(true);
    expect(mocks.initializeWeb).not.toHaveBeenCalled();
  });

  it('fails closed for web Functions when the site key is missing', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { initializeFirebaseAppCheck } = await loadSubject();
    expect(initializeFirebaseAppCheck(app)).toBe(false);
    expect(mocks.initializeWeb).not.toHaveBeenCalled();
    warning.mockRestore();
  });

  it('initializes the reCAPTCHA Enterprise provider once', async () => {
    vi.stubEnv('VITE_APP_CHECK_SITE_KEY', 'site-key');
    vi.stubEnv('VITE_APP_CHECK_DEBUG_TOKEN', '11111111-2222-3333-4444-555555555555');
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { initializeFirebaseAppCheck } = await loadSubject();
    expect(initializeFirebaseAppCheck(app)).toBe(true);
    expect(initializeFirebaseAppCheck(app)).toBe(true);
    expect(mocks.recaptchaKey).toBe('site-key');
    expect(mocks.initializeWeb).toHaveBeenCalledTimes(1);
    expect(warning).toHaveBeenCalledWith(
      expect.stringContaining('11111111-2222-3333-4444-555555555555')
    );
    warning.mockRestore();
  });

  it('bridges native attestation and supplies a conservative token expiry', async () => {
    mocks.native = true;
    const { initializeFirebaseAppCheck } = await loadSubject();
    expect(initializeFirebaseAppCheck(app)).toBe(true);
    expect(mocks.initializeNative).toHaveBeenCalledWith({ isTokenAutoRefreshEnabled: false });
    expect(mocks.initializeWeb).toHaveBeenCalledWith(
      app,
      expect.objectContaining({ isTokenAutoRefreshEnabled: false })
    );
    const token = await mocks.customOptions!.getToken();
    expect(token.token).toBe('native-token');
    expect(token.expireTimeMillis).toBeGreaterThan(Date.now());
  });

  it('force-refreshes native App Check tokens for ladder Callables', async () => {
    mocks.native = true;
    const { initializeFirebaseAppCheck, ensureFreshAppCheckToken } = await loadSubject();
    expect(initializeFirebaseAppCheck(app)).toBe(true);
    await expect(ensureFreshAppCheckToken(true)).resolves.toBe(true);
    expect(mocks.getNativeToken).toHaveBeenCalledWith({ forceRefresh: true });
  });

  it('normalizes second-based native expiry to milliseconds', async () => {
    mocks.native = true;
    const futureSec = Math.floor(Date.now() / 1000) + 3600;
    mocks.getNativeToken.mockResolvedValue({ token: 'native-token', expireTimeMillis: futureSec });
    const { initializeFirebaseAppCheck, resetNativeAppCheckTokenCacheForTests } = await loadSubject();
    resetNativeAppCheckTokenCacheForTests();
    initializeFirebaseAppCheck(app);
    const token = await mocks.customOptions!.getToken();
    expect(token.expireTimeMillis).toBeGreaterThan(Date.now() + 30 * 60 * 1000);
  });

  it('debounces native getToken within 10 seconds when token is still valid', async () => {
    mocks.native = true;
    const futureMs = Date.now() + 60 * 60 * 1000;
    mocks.getNativeToken.mockResolvedValue({ token: 'native-token', expireTimeMillis: futureMs });
    const { initializeFirebaseAppCheck, resetNativeAppCheckTokenCacheForTests } = await loadSubject();
    resetNativeAppCheckTokenCacheForTests();
    initializeFirebaseAppCheck(app);
    await mocks.customOptions!.getToken();
    await mocks.customOptions!.getToken();
    expect(mocks.getNativeToken).toHaveBeenCalledTimes(1);
  });

  it('hard-blocks native bridge within 3 seconds of the previous bridge call', async () => {
    vi.useFakeTimers();
    mocks.native = true;
    const futureMs = Date.now() + 60 * 60 * 1000;
    mocks.getNativeToken.mockResolvedValue({ token: 'native-token', expireTimeMillis: futureMs });
    const { initializeFirebaseAppCheck, resetNativeAppCheckTokenCacheForTests } = await loadSubject();
    resetNativeAppCheckTokenCacheForTests();
    initializeFirebaseAppCheck(app);

    await mocks.customOptions!.getToken();
    expect(mocks.getNativeToken).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(11_000);
    await mocks.customOptions!.getToken();
    expect(mocks.getNativeToken).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1_000);
    await mocks.customOptions!.getToken();
    expect(mocks.getNativeToken).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('does not reuse bridge cooldown cache when token is near expiry', async () => {
    vi.useFakeTimers();
    mocks.native = true;
    const nearExpiryMs = Date.now() + 30_000;
    mocks.getNativeToken.mockResolvedValue({ token: 'native-token', expireTimeMillis: nearExpiryMs });
    const { initializeFirebaseAppCheck, resetNativeAppCheckTokenCacheForTests } = await loadSubject();
    resetNativeAppCheckTokenCacheForTests();
    initializeFirebaseAppCheck(app);

    await mocks.customOptions!.getToken();
    expect(mocks.getNativeToken).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1_000);
    await mocks.customOptions!.getToken();
    expect(mocks.getNativeToken).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('bypasses debounce cache when forceRefresh is requested', async () => {
    mocks.native = true;
    const futureMs = Date.now() + 60 * 60 * 1000;
    mocks.getNativeToken.mockResolvedValue({ token: 'native-token', expireTimeMillis: futureMs });
    const { initializeFirebaseAppCheck, ensureFreshAppCheckToken, resetNativeAppCheckTokenCacheForTests } =
      await loadSubject();
    resetNativeAppCheckTokenCacheForTests();
    initializeFirebaseAppCheck(app);
    await mocks.customOptions!.getToken();
    await ensureFreshAppCheckToken(true);
    expect(mocks.getNativeToken).toHaveBeenCalledTimes(2);
    expect(mocks.getNativeToken).toHaveBeenLastCalledWith({ forceRefresh: true });
  });
});

describe('normalizeExpireTimeMillis', () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  it('defaults missing or invalid expiry to a future window', async () => {
    const { normalizeExpireTimeMillis } = await loadSubject();
    const now = Date.now();
    expect(normalizeExpireTimeMillis(undefined)).toBeGreaterThan(now + 29 * 60 * 1000);
    expect(normalizeExpireTimeMillis(Number.NaN)).toBeGreaterThan(now + 29 * 60 * 1000);
  });

  it('converts second-based timestamps to milliseconds', async () => {
    const { normalizeExpireTimeMillis } = await loadSubject();
    const futureSec = Math.floor(Date.now() / 1000) + 7200;
    expect(normalizeExpireTimeMillis(futureSec)).toBe(futureSec * 1000);
  });

  it('replaces expired timestamps with a conservative ttl', async () => {
    const { normalizeExpireTimeMillis } = await loadSubject();
    const now = Date.now();
    expect(normalizeExpireTimeMillis(now - 1000)).toBeGreaterThan(now + 29 * 60 * 1000);
  });
});
