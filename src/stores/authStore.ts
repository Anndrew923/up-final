import { create } from 'zustand';
import type { User } from 'firebase/auth';
import { resolveDisplayName } from '../logic/core/identity';
import { loadProfile } from '../services/localStorageService';

export type AuthSessionStatus = 'loading' | 'signed-out' | 'signed-in';

export interface AuthSessionState {
  status: AuthSessionStatus;
  uid: string | null;
  displayName: string;
  email: string | null;
  /** Snapshot from Firebase `user.displayName` — used to recompute `displayName` after local profile edits. */
  firebaseDisplayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  setLoading(): void;
  setSignedOut(): void;
  setFromUser(user: User): void;
  /** Re-run `resolveDisplayName` after `saveProfile` (ladder identity / local display name). */
  refreshDisplayNameFromProfiles(): void;
}

const FALLBACK_DISPLAY_NAME = resolveDisplayName({});

function localDisplayNameFallback(): string | null {
  return loadProfile()?.displayName ?? null;
}

export const useAuthStore = create<AuthSessionState>((set) => ({
  status: 'loading',
  uid: null,
  displayName: FALLBACK_DISPLAY_NAME,
  email: null,
  firebaseDisplayName: null,
  photoURL: null,
  isAnonymous: false,
  setLoading() {
    set((state) => ({
      ...state,
      status: 'loading',
    }));
  },
  setSignedOut() {
    set({
      status: 'signed-out',
      uid: null,
      displayName: resolveDisplayName({
        localDisplayName: localDisplayNameFallback(),
      }),
      email: null,
      firebaseDisplayName: null,
      photoURL: null,
      isAnonymous: false,
    });
  },
  setFromUser(user) {
    set({
      status: 'signed-in',
      uid: user.uid,
      firebaseDisplayName: user.displayName ?? null,
      displayName: resolveDisplayName({
        firebaseDisplayName: user.displayName,
        email: user.email,
        localDisplayName: localDisplayNameFallback(),
      }),
      email: user.email,
      photoURL: user.photoURL,
      isAnonymous: user.isAnonymous,
    });
  },
  refreshDisplayNameFromProfiles() {
    set((state) => ({
      ...state,
      displayName: resolveDisplayName({
        firebaseDisplayName: state.firebaseDisplayName,
        email: state.email,
        localDisplayName: localDisplayNameFallback(),
      }),
    }));
  },
}));
