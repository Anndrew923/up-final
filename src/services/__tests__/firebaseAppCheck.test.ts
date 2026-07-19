import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FirebaseApp } from 'firebase/app';

const mocks = vi.hoisted(() => ({
  native: false,
  emulator: false,
  initializeNative: vi.fn(() => Promise.resolve()),
  getNativeToken: vi.fn(() => Promise.resolve({ token: 'native-token' })),
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
    const { initializeFirebaseAppCheck } = await loadSubject();
    expect(initializeFirebaseAppCheck(app)).toBe(true);
    expect(initializeFirebaseAppCheck(app)).toBe(true);
    expect(mocks.recaptchaKey).toBe('site-key');
    expect(mocks.initializeWeb).toHaveBeenCalledTimes(1);
  });

  it('bridges native attestation and supplies a conservative token expiry', async () => {
    mocks.native = true;
    const { initializeFirebaseAppCheck } = await loadSubject();
    expect(initializeFirebaseAppCheck(app)).toBe(true);
    const token = await mocks.customOptions!.getToken();
    expect(token.token).toBe('native-token');
    expect(token.expireTimeMillis).toBeGreaterThan(Date.now());
  });
});
