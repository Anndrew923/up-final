import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  native: false,
  ensureAuth: vi.fn(() => Promise.resolve(true)),
  ensureAppCheck: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('../../lib/capacitorPlatform', () => ({
  isCapacitorNativePlatform: () => mocks.native,
}));

vi.mock('../firebaseClient', () => ({
  ensureFreshFirebaseIdToken: mocks.ensureAuth,
}));

vi.mock('../firebaseAppCheck', () => ({
  ensureFreshAppCheckToken: mocks.ensureAppCheck,
}));

async function loadSubject() {
  vi.resetModules();
  const mod = await import('../leaderboardFirestoreSession');
  mod.resetLeaderboardFirestoreSessionForTests();
  return mod;
}

describe('leaderboardFirestoreSession', () => {
  beforeEach(() => {
    mocks.native = false;
    mocks.ensureAuth.mockClear();
    mocks.ensureAppCheck.mockClear();
    mocks.ensureAuth.mockResolvedValue(true);
    mocks.ensureAppCheck.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('resolveLeaderboardFirestoreErrorReason', () => {
    it('maps Firebase error codes to ladder read failure reasons', async () => {
      const { resolveLeaderboardFirestoreErrorReason } = await loadSubject();
      expect(resolveLeaderboardFirestoreErrorReason({ code: 'permission-denied' })).toBe(
        'permission-denied'
      );
      expect(resolveLeaderboardFirestoreErrorReason({ code: 'unauthenticated' })).toBe(
        'unauthenticated'
      );
      expect(resolveLeaderboardFirestoreErrorReason({ code: 'unavailable' })).toBe('unavailable');
      expect(resolveLeaderboardFirestoreErrorReason({ code: 'failed-precondition' })).toBe(
        'failed-precondition'
      );
      expect(
        resolveLeaderboardFirestoreErrorReason({
          code: 'functions/unauthenticated',
          message: 'App Check token is invalid.',
        })
      ).toBe('app-check');
      expect(resolveLeaderboardFirestoreErrorReason(new Error('network glitch'))).toBe('unknown');
    });
  });

  describe('prepareLeaderboardFirestoreRead', () => {
    it('no-ops on web', async () => {
      const { prepareLeaderboardFirestoreRead } = await loadSubject();
      await prepareLeaderboardFirestoreRead();
      expect(mocks.ensureAuth).not.toHaveBeenCalled();
      expect(mocks.ensureAppCheck).not.toHaveBeenCalled();
    });

    it('refreshes auth and app check on native', async () => {
      mocks.native = true;
      const { prepareLeaderboardFirestoreRead } = await loadSubject();
      await prepareLeaderboardFirestoreRead();
      expect(mocks.ensureAuth).toHaveBeenCalledTimes(1);
      expect(mocks.ensureAppCheck).toHaveBeenCalledWith(false);
    });

    it('coalesces concurrent native prepare calls', async () => {
      mocks.native = true;
      let releaseAuth!: () => void;
      const authGate = new Promise<boolean>((resolve) => {
        releaseAuth = () => resolve(true);
      });
      mocks.ensureAuth.mockImplementation(() => authGate);

      const { prepareLeaderboardFirestoreRead } = await loadSubject();
      const first = prepareLeaderboardFirestoreRead();
      const second = prepareLeaderboardFirestoreRead();
      expect(mocks.ensureAuth).toHaveBeenCalledTimes(1);
      expect(mocks.ensureAppCheck).toHaveBeenCalledTimes(1);

      releaseAuth();
      await Promise.all([first, second]);
    });
  });

  describe('logLeaderboardFirestoreError', () => {
    it('logs permission-denied as console.error in DEV', async () => {
      vi.stubEnv('DEV', true);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const { logLeaderboardFirestoreError } = await loadSubject();
      logLeaderboardFirestoreError('listLeaderboard', { code: 'permission-denied', message: 'denied' });
      expect(errorSpy).toHaveBeenCalledWith(
        '[leaderboard] listLeaderboard',
        expect.objectContaining({ code: 'permission-denied', message: 'denied' })
      );
      errorSpy.mockRestore();
    });
  });
});
