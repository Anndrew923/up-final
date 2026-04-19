import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from 'firebase/app';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

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
  firestoreDb = getFirestore(firebaseApp);
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
