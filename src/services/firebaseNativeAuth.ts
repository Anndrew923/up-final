import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { isCapacitorNativePlatform } from '../lib/capacitorPlatform';
import { GOOGLE_SIGN_IN_ACCOUNT_PICKER_CUSTOM_PARAMETERS } from './googleAuthProviderConfig';
import {
  GoogleAuthProvider,
  signInWithCredential,
  type Auth,
  type User,
} from 'firebase/auth';
function requireIdToken(idToken: string | null | undefined): string {
  if (!idToken?.trim()) {
    throw new Error('google-native-no-id-token');
  }
  return idToken.trim();
}

export async function signInWithGoogleNative(auth: Auth): Promise<User> {
  const result = await FirebaseAuthentication.signInWithGoogle({
    skipNativeAuth: true,
    // Android Credential Manager / iOS GIDSignIn already surface account UI;
    // keep OAuth parity for any web-layer fallbacks inside the plugin.
    customParameters: [...GOOGLE_SIGN_IN_ACCOUNT_PICKER_CUSTOM_PARAMETERS],
  });
  const idToken = requireIdToken(result.credential?.idToken);
  const credential = GoogleAuthProvider.credential(idToken);
  const signedIn = await signInWithCredential(auth, credential);
  return signedIn.user;
}

/** Re-auth for sensitive actions (e.g. account deletion) using the same native Google flow. */
export async function reauthenticateWithGoogleNative(auth: Auth): Promise<void> {
  await signInWithGoogleNative(auth);
}

export async function signOutNative(): Promise<void> {
  if (!isCapacitorNativePlatform()) return;
  try {
    await FirebaseAuthentication.signOut();
  } catch {
    // Native layer may already be signed out; JS signOut remains source of truth for app state.
  }
}
