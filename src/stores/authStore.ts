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
  photoURL: string | null;
  isAnonymous: boolean;
  setLoading(): void;
  setSignedOut(): void;
  setFromUser(user: User): void;
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
      photoURL: null,
      isAnonymous: false,
    });
  },
  setFromUser(user) {
    set({
      status: 'signed-in',
      uid: user.uid,
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
}));
