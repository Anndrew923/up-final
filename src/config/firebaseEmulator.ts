/**
 * Opt-in Firebase Emulator wiring (local dev only).
 * WHY: P2 ladder writes require Callable + Rules; emulators avoid touching production data.
 */
export function isFirebaseEmulatorEnabled(): boolean {
  return String(import.meta.env.VITE_FIREBASE_USE_EMULATORS ?? '').trim() === 'true';
}

export const FIREBASE_EMULATOR_HOST = '127.0.0.1';

export const FIREBASE_EMULATOR_PORTS = {
  auth: 9099,
  firestore: 8080,
  functions: 5001,
} as const;
