import { beforeEach, describe, expect, it, vi } from 'vitest';

const setFromUserSpy = vi.fn();

type MockAuthState = {
  status: 'loading' | 'signed-out' | 'signed-in';
  isAnonymous: boolean;
  setFromUser: (user: { uid: string; isAnonymous: boolean }) => void;
};

let mockAuthState: MockAuthState;

vi.mock('../../stores/authStore', () => ({
  useAuthStore: {
    getState: () => mockAuthState,
    subscribe: () => () => {},
  },
}));

const getCurrentFirebaseUser = vi.fn();
const onFirebaseAuthStateChanged = vi.fn();

vi.mock('../firebaseClient', () => ({
  getCurrentFirebaseUser,
  onFirebaseAuthStateChanged,
}));

function createMockAuthState(
  initial: Pick<MockAuthState, 'status' | 'isAnonymous'>
): MockAuthState {
  const state: MockAuthState = {
    ...initial,
    setFromUser(user) {
      state.status = 'signed-in';
      state.isAnonymous = user.isAnonymous;
      setFromUserSpy(user);
    },
  };
  return state;
}

describe('waitForAnonymousAuthSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockAuthState = createMockAuthState({ status: 'signed-out', isAnonymous: false });
    getCurrentFirebaseUser.mockReturnValue(null);
    onFirebaseAuthStateChanged.mockReturnValue(() => {});
  });

  it('resolves immediately when store already has anonymous session', async () => {
    mockAuthState = createMockAuthState({ status: 'signed-in', isAnonymous: true });

    const { waitForAnonymousAuthSession } = await import('../authSessionWait');
    await expect(waitForAnonymousAuthSession()).resolves.toBeUndefined();
    expect(onFirebaseAuthStateChanged).not.toHaveBeenCalled();
  });

  it('syncs store from Firebase currentUser when listener lags', async () => {
    getCurrentFirebaseUser.mockReturnValue({ uid: 'anon-1', isAnonymous: true });

    const { waitForAnonymousAuthSession } = await import('../authSessionWait');
    await expect(waitForAnonymousAuthSession()).resolves.toBeUndefined();
    expect(setFromUserSpy).toHaveBeenCalledWith({ uid: 'anon-1', isAnonymous: true });
    expect(mockAuthState.status).toBe('signed-in');
    expect(mockAuthState.isAnonymous).toBe(true);
  });

  it('resolves when auth state listener delivers anonymous user', async () => {
    onFirebaseAuthStateChanged.mockImplementation((listener: (user: unknown) => void) => {
      queueMicrotask(() => listener({ uid: 'anon-2', isAnonymous: true }));
      return () => {};
    });

    const { waitForAnonymousAuthSession } = await import('../authSessionWait');
    await expect(waitForAnonymousAuthSession()).resolves.toBeUndefined();
    expect(setFromUserSpy).toHaveBeenCalledWith({ uid: 'anon-2', isAnonymous: true });
  });
});
