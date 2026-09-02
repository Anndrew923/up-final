import { beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithGoogle = vi.fn();
const signInWithApple = vi.fn();
const signOut = vi.fn();

const isAndroidNativePlatform = vi.fn(() => true);
const isIosNativePlatform = vi.fn(() => false);
const isCapacitorNativePlatform = vi.fn(() => true);

vi.mock('@capacitor-firebase/authentication', () => ({
  FirebaseAuthentication: {
    signInWithGoogle,
    signInWithApple,
    signOut,
  },
}));

vi.mock('../../lib/capacitorPlatform', () => ({
  isCapacitorNativePlatform,
  isAndroidNativePlatform,
  isIosNativePlatform,
}));

vi.mock('../../config/firebaseEmulator', () => ({
  isFirebaseEmulatorEnabled: vi.fn(() => false),
}));

const signInWithCredential = vi.fn();
const oauthCredential = vi.fn(
  (input: { idToken: string; rawNonce?: string }) => ({
    providerId: 'apple.com',
    ...input,
  })
);

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: {
    credential: vi.fn((idToken: string) => ({ providerId: 'google.com', idToken })),
  },
  OAuthProvider: vi.fn().mockImplementation(() => ({
    credential: oauthCredential,
  })),
  signInWithCredential,
}));

describe('firebaseNativeAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    isAndroidNativePlatform.mockReturnValue(true);
    isIosNativePlatform.mockReturnValue(false);
    isCapacitorNativePlatform.mockReturnValue(true);
  });

  it('signInWithGoogleNative bridges id token into Firebase JS auth on Android', async () => {
    signInWithGoogle.mockResolvedValue({
      credential: { idToken: 'native-id-token' },
    });
    signInWithCredential.mockResolvedValue({
      user: { uid: 'uid-1', isAnonymous: false },
    });

    const { signInWithGoogleNative } = await import('../firebaseNativeAuth');
    const auth = {} as import('firebase/auth').Auth;
    const user = await signInWithGoogleNative(auth);

    expect(signInWithGoogle).toHaveBeenCalledWith({
      skipNativeAuth: true,
      customParameters: [{ key: 'prompt', value: 'select_account' }],
    });
    expect(signInWithCredential).toHaveBeenCalled();
    expect(user.uid).toBe('uid-1');
  });

  it('signInWithGoogleNative omits customParameters on iOS', async () => {
    isAndroidNativePlatform.mockReturnValue(false);
    isIosNativePlatform.mockReturnValue(true);

    signInWithGoogle.mockResolvedValue({
      credential: { idToken: 'native-id-token' },
    });
    signInWithCredential.mockResolvedValue({
      user: { uid: 'uid-ios', isAnonymous: false },
    });

    const { signInWithGoogleNative } = await import('../firebaseNativeAuth');
    const auth = {} as import('firebase/auth').Auth;
    const user = await signInWithGoogleNative(auth);

    expect(signInWithGoogle).toHaveBeenCalledWith({
      skipNativeAuth: true,
    });
    expect(user.uid).toBe('uid-ios');
  });

  it('signInWithAppleNative bridges id token + nonce into Firebase JS auth', async () => {
    isIosNativePlatform.mockReturnValue(true);

    signInWithApple.mockResolvedValue({
      credential: { idToken: 'apple-id-token', nonce: 'apple-nonce' },
    });
    signInWithCredential.mockResolvedValue({
      user: { uid: 'uid-apple', isAnonymous: false },
    });

    const { signInWithAppleNative } = await import('../firebaseNativeAuth');
    const auth = {} as import('firebase/auth').Auth;
    const user = await signInWithAppleNative(auth);

    expect(signInWithApple).toHaveBeenCalledWith({
      skipNativeAuth: true,
      scopes: ['email', 'name'],
    });
    expect(oauthCredential).toHaveBeenCalledWith({
      idToken: 'apple-id-token',
      rawNonce: 'apple-nonce',
    });
    expect(signInWithCredential).toHaveBeenCalled();
    expect(user.uid).toBe('uid-apple');
  });

  it('logs signInWithCredential failures without duplicate native-sign-in logs', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    signInWithGoogle.mockResolvedValue({
      credential: { idToken: 'native-id-token' },
    });
    signInWithCredential.mockRejectedValue({
      code: 'auth/invalid-credential',
      message: 'Invalid credential',
    });

    const { signInWithGoogleNative } = await import('../firebaseNativeAuth');
    const auth = {} as import('firebase/auth').Auth;

    await expect(signInWithGoogleNative(auth)).rejects.toMatchObject({
      code: 'auth/invalid-credential',
    });

    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls[0]?.[0]).toBe('[auth-native] google signInWithCredential failed');

    consoleError.mockRestore();
  });
});
