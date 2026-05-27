import { beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithGoogle = vi.fn();
const signOut = vi.fn();

vi.mock('@capacitor-firebase/authentication', () => ({
  FirebaseAuthentication: {
    signInWithGoogle,
    signOut,
  },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
    getPlatform: vi.fn(() => 'web'),
  },
}));

vi.mock('../../config/firebaseEmulator', () => ({
  isFirebaseEmulatorEnabled: vi.fn(() => false),
}));

const signInWithCredential = vi.fn();

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: {
    credential: vi.fn((idToken: string) => ({ providerId: 'google.com', idToken })),
  },
  signInWithCredential,
}));

describe('firebaseNativeAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('signInWithGoogleNative bridges id token into Firebase JS auth', async () => {
    const { Capacitor } = await import('@capacitor/core');
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

    signInWithGoogle.mockResolvedValue({
      credential: { idToken: 'native-id-token' },
    });
    signInWithCredential.mockResolvedValue({
      user: { uid: 'uid-1', isAnonymous: false },
    });

    const { signInWithGoogleNative } = await import('../firebaseNativeAuth');
    const auth = {} as import('firebase/auth').Auth;
    const user = await signInWithGoogleNative(auth);

    expect(signInWithGoogle).toHaveBeenCalledWith({ skipNativeAuth: true });
    expect(signInWithCredential).toHaveBeenCalled();
    expect(user.uid).toBe('uid-1');
  });
});
