export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

function trimEnv(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Reads VITE_FIREBASE_* from import.meta.env. When all four are set, initializes the client.
 * Safe to call with missing env (local-first app runs without Firebase until configured).
 */
export function tryInitFirebaseFromEnv(): void {
  const apiKey = trimEnv(import.meta.env.VITE_FIREBASE_API_KEY);
  const authDomain = trimEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
  const projectId = trimEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID);
  const appId = trimEnv(import.meta.env.VITE_FIREBASE_APP_ID);

  const parts = [apiKey, authDomain, projectId, appId];
  const allSet = parts.every(Boolean);
  const anySet = parts.some(Boolean);

  if (allSet) {
    initFirebase({ apiKey, authDomain, projectId, appId });
    return;
  }

  if (anySet && import.meta.env.DEV) {
    console.warn(
      '[firebase] Incomplete VITE_FIREBASE_* env; expected all of: VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID',
    );
  }
}

let firebaseConfig: FirebaseConfig | null = null;
let firestoreClient: unknown = null;

export function initFirebase(config: FirebaseConfig): void {
  firebaseConfig = { ...config };
  firestoreClient = { config: firebaseConfig };
}

export function getFirestoreClient(): unknown {
  return firestoreClient;
}
