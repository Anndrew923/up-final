import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import {
  isAndroidNativePlatform,
  isCapacitorNativePlatform,
} from '../lib/capacitorPlatform';
import { getFirebaseAuthErrorDetails } from './firebaseAuthError';
import { GOOGLE_SIGN_IN_ACCOUNT_PICKER_CUSTOM_PARAMETERS } from './googleAuthProviderConfig';
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  type Auth,
  type User,
} from 'firebase/auth';

function requireIdToken(idToken: string | null | undefined, code: string): string {
  if (!idToken?.trim()) {
    throw new Error(code);
  }
  return idToken.trim();
}

/** WHY: Production auth failures were swallowed by UI catch blocks — surface codes in device logs. */
function logNativeAuthError(
  provider: 'google' | 'apple',
  phase: string,
  error: unknown
): void {
  const { code, message } = getFirebaseAuthErrorDetails(error);
  console.error(`[auth-native] ${provider} ${phase} failed`, { code, message, error });
}

export async function signInWithGoogleNative(auth: Auth): Promise<User> {
  let nativeResult: Awaited<ReturnType<typeof FirebaseAuthentication.signInWithGoogle>>;
  try {
    const googleOptions: Parameters<typeof FirebaseAuthentication.signInWithGoogle>[0] = {
      skipNativeAuth: true,
    };
    // WHY: Plugin docs — customParameters are not supported for Google on iOS; passing them can crash GIDSignIn.
    if (isAndroidNativePlatform()) {
      googleOptions.customParameters = [...GOOGLE_SIGN_IN_ACCOUNT_PICKER_CUSTOM_PARAMETERS];
    }
    nativeResult = await FirebaseAuthentication.signInWithGoogle(googleOptions);
  } catch (error) {
    logNativeAuthError('google', 'native-sign-in', error);
    throw error;
  }

  const idToken = requireIdToken(nativeResult.credential?.idToken, 'google-native-no-id-token');

  if (import.meta.env.DEV) {
    console.warn('[auth-native] google native credential received', { hasIdToken: Boolean(idToken) });
  }

  const credential = GoogleAuthProvider.credential(idToken);
  try {
    const signedIn = await signInWithCredential(auth, credential);
    return signedIn.user;
  } catch (error) {
    logNativeAuthError('google', 'signInWithCredential', error);
    throw error;
  }
}

/**
 * Sign in with Apple on native iOS, then bridge the id token + nonce into Firebase JS Auth.
 * WHY: skipNativeAuth is required so Apple's nonce is returned for OAuthProvider.credential.
 */
export async function signInWithAppleNative(auth: Auth): Promise<User> {
  let nativeResult: Awaited<ReturnType<typeof FirebaseAuthentication.signInWithApple>>;
  try {
    nativeResult = await FirebaseAuthentication.signInWithApple({
      skipNativeAuth: true,
      scopes: ['email', 'name'],
    });
  } catch (error) {
    logNativeAuthError('apple', 'native-sign-in', error);
    throw error;
  }

  const idToken = requireIdToken(nativeResult.credential?.idToken, 'apple-native-no-id-token');
  const rawNonce = nativeResult.credential?.nonce ?? undefined;

  if (import.meta.env.DEV) {
    console.warn('[auth-native] apple native credential received', {
      hasIdToken: Boolean(idToken),
      hasNonce: Boolean(rawNonce),
    });
  }

  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken,
    rawNonce,
  });
  try {
    const signedIn = await signInWithCredential(auth, credential);
    return signedIn.user;
  } catch (error) {
    logNativeAuthError('apple', 'signInWithCredential', error);
    throw error;
  }
}

/** Re-auth for sensitive actions (e.g. account deletion) using the same native Google flow. */
export async function reauthenticateWithGoogleNative(auth: Auth): Promise<void> {
  await signInWithGoogleNative(auth);
}

/** Re-auth via Apple on iOS for sensitive actions. */
export async function reauthenticateWithAppleNative(auth: Auth): Promise<void> {
  await signInWithAppleNative(auth);
}

export async function signOutNative(): Promise<void> {
  if (!isCapacitorNativePlatform()) return;
  try {
    await FirebaseAuthentication.signOut();
  } catch {
    // Native layer may already be signed out; JS signOut remains source of truth for app state.
  }
}
