/**
 * P2 ladder writes via Cloud Functions (required once Firestore rules block client setDoc).
 * Deploy functions before enabling; see docs/LADDER_UPLOAD_P2.md.
 */
export function isLadderCallableWritesEnabled(): boolean {
  return String(import.meta.env.VITE_LADDER_CALLABLE_WRITES ?? '').trim() === 'true';
}

export function getLadderFunctionsRegion(): string {
  const raw = String(import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION ?? 'us-central1').trim();
  return raw || 'us-central1';
}
