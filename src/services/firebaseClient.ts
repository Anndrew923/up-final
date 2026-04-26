import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from 'firebase/app';
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithPopup,
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type Auth,
  type UserCredential,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

function trimEnv(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let firebaseAuth: Auth | null = null;

/**
 * When proxies / HTTP2 / extensions break the default WebChannel stream, Firestore Listen
 * may return HTML 400 "Unknown SID". Long-polling auto-detect avoids that transport path.
 */
function initFirestoreForApp(app: FirebaseApp): Firestore {
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch (e: unknown) {
    const code =
      typeof e === 'object' && e !== null && 'code' in e
        ? String((e as { code?: unknown }).code)
        : '';
    if (code === 'failed-precondition') {
      return getFirestore(app);
    }
    throw e;
  }
}

const GOOGLE_REDIRECT_PENDING_KEY = 'up.auth.googleRedirectPending';
const GOOGLE_REDIRECT_RETRY_KEY = 'up.auth.googleRedirectRetry';

/**
 * Reads `VITE_FIREBASE_*` from `import.meta.env`.
 * Local-first app runs without Firebase until all fields are configured.
 */
export function tryInitFirebaseFromEnv(): void {
  const apiKey = trimEnv(import.meta.env.VITE_FIREBASE_API_KEY);
  const authDomain = trimEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
  const projectId = trimEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID);
  const appId = trimEnv(import.meta.env.VITE_FIREBASE_APP_ID);

  const parts = [apiKey, authDomain, projectId, appId];
  const allSet = parts.every(Boolean);
  const anySet = parts.some(Boolean);

  if (!allSet) {
    if (anySet && import.meta.env.DEV) {
      console.warn(
        '[firebase] Incomplete VITE_FIREBASE_* env; expected all of: VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID'
      );
    }
    return;
  }

  initFirebase({ apiKey, authDomain, projectId, appId });
}

export function initFirebase(config: FirebaseConfig): void {
  const opts: FirebaseOptions = {
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    appId: config.appId,
  };

  firebaseApp = getApps().length ? getApp() : initializeApp(opts);
  firestoreDb = initFirestoreForApp(firebaseApp);
  firebaseAuth = getAuth(firebaseApp);
}

export function getFirebaseApp(): FirebaseApp | null {
  return firebaseApp;
}

export function getFirestoreDb(): Firestore | null {
  return firestoreDb;
}

/** Prefer this over `Boolean(getFirestoreDb())` when only checking configuration (no tree-shaking concerns). */
export function isFirestoreConfigured(): boolean {
  return firestoreDb !== null;
}

export function getFirebaseAuth(): Auth | null {
  return firebaseAuth;
}

export function getCurrentFirebaseUser(): User | null {
  return firebaseAuth?.currentUser ?? null;
}

export function onFirebaseAuthStateChanged(listener: (user: User | null) => void): Unsubscribe {
  if (!firebaseAuth) {
    listener(null);
    return () => {};
  }
  return onAuthStateChanged(firebaseAuth, listener);
}

function readSessionFlag(key: string): boolean {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(key) === '1';
}

function writeSessionFlag(key: string, value: boolean): void {
  if (typeof window === 'undefined') return;
  if (value) {
    window.sessionStorage.setItem(key, '1');
    return;
  }
  window.sessionStorage.removeItem(key);
}

function markGoogleRedirectPending(): void {
  writeSessionFlag(GOOGLE_REDIRECT_PENDING_KEY, true);
}

function clearGoogleRedirectPending(): void {
  writeSessionFlag(GOOGLE_REDIRECT_PENDING_KEY, false);
  writeSessionFlag(GOOGLE_REDIRECT_RETRY_KEY, false);
}

export function isGoogleRedirectPending(): boolean {
  return readSessionFlag(GOOGLE_REDIRECT_PENDING_KEY);
}

async function startGoogleRedirect(auth: Auth, provider: GoogleAuthProvider): Promise<null> {
  markGoogleRedirectPending();
  await signInWithRedirect(auth, provider);
  return null;
}

/**
 * Consume Firebase redirect result early after app bootstrap.
 * This prevents transient redirect errors from surfacing as noisy unhandled flashes.
 */
export async function consumeFirebaseRedirectResult(): Promise<UserCredential | null> {
  if (!firebaseAuth) return null;
  try {
    const result = await getRedirectResult(firebaseAuth);
    if (result?.user) {
      clearGoogleRedirectPending();
    } else if (isGoogleRedirectPending()) {
      // No result after returning from redirect means flow has ended; clear stale pending flag.
      clearGoogleRedirectPending();
    }
    if (import.meta.env.DEV && result?.user) {
      console.warn('[auth] redirect result consumed', {
        uid: result.user.uid,
        isAnonymous: result.user.isAnonymous,
        providerId: result.providerId,
      });
    }
    return result;
  } catch (error) {
    const code = getFirebaseAuthErrorCode(error);
    if (
      (code === 'auth/credential-already-in-use' ||
        code === 'auth/account-exists-with-different-credential') &&
      !readSessionFlag(GOOGLE_REDIRECT_RETRY_KEY)
    ) {
      writeSessionFlag(GOOGLE_REDIRECT_RETRY_KEY, true);
      if (import.meta.env.DEV) {
        console.warn('[auth] redirect result conflict, retrying once with signed-out state', { code });
      }
      await signOut(firebaseAuth);
      const provider = new GoogleAuthProvider();
      await startGoogleRedirect(firebaseAuth, provider);
      return null;
    }
    if (import.meta.env.DEV) {
      console.warn('[auth] consume redirect result failed', { code, error });
    }
    clearGoogleRedirectPending();
    return null;
  }
}

function getFirebaseAuthErrorCode(error: unknown): string {
  return typeof error === 'object' && error && 'code' in error
    ? String((error as { code?: unknown }).code)
    : '';
}

/**
 * Starts Google redirect sign-in for all web cases.
 * Returns null because redirect flow completes after page reload.
 */
export async function signInWithGoogleWeb(): Promise<User | null> {
  if (!firebaseAuth) {
    throw new Error('firebase-auth-not-configured');
  }
  const provider = new GoogleAuthProvider();

  const currentUser = firebaseAuth.currentUser;
  const wasAnonymous = Boolean(currentUser?.isAnonymous);
  if (wasAnonymous) {
    // Keep this in the same user gesture path, then open exactly one popup sign-in.
    await signOut(firebaseAuth);
  }

  try {
    if (import.meta.env.DEV) {
      console.warn('[auth] starting google popup sign-in', { wasAnonymous });
    }
    const credential = await signInWithPopup(firebaseAuth, provider);
    clearGoogleRedirectPending();
    return credential.user;
  } catch (error) {
    const code = getFirebaseAuthErrorCode(error);
    if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
      if (import.meta.env.DEV) {
        console.warn('[auth] popup unavailable, switching to redirect sign-in', { code, wasAnonymous });
      }
      return startGoogleRedirect(firebaseAuth, provider);
    }
    if (import.meta.env.DEV) {
      console.warn('[auth] google popup sign-in failed', { code, error, wasAnonymous });
    }
    throw error;
  }
}

export async function signInAnonymouslyWeb(): Promise<User> {
  if (!firebaseAuth) {
    throw new Error('firebase-auth-not-configured');
  }
  if (firebaseAuth.currentUser) {
    return firebaseAuth.currentUser;
  }
  const credential = await signInAnonymously(firebaseAuth);
  return credential.user;
}

export async function signOutFirebase(): Promise<void> {
  if (!firebaseAuth) return;
  await signOut(firebaseAuth);
}

/**
 * Re-authenticate current signed-in Google user for sensitive actions (e.g. delete account).
 */
export async function reauthenticateCurrentGoogleUserWeb(): Promise<void> {
  if (!firebaseAuth) {
    throw new Error('firebase-auth-not-configured');
  }
  const user = firebaseAuth.currentUser;
  if (!user || user.isAnonymous) {
    throw new Error('auth-not-ready');
  }
  const provider = new GoogleAuthProvider();
  await reauthenticateWithPopup(user, provider);
}

/**
 * Anonymous auth so Firestore rules can scope writes to `request.auth.uid`.
 * Must be enabled in Firebase Console → Authentication → Sign-in method → Anonymous.
 */
export async function ensureFirebaseAuthReady(): Promise<string | null> {
  const auth = firebaseAuth;
  if (!auth) return null;
  if (auth.currentUser?.uid) return auth.currentUser.uid;
  const credential = await signInAnonymously(auth);
  return credential.user.uid;
}
