import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { signInWithGoogleWeb, signOutFirebase } from '../services/firebaseClient';
import { useAuthStore } from '../stores/authStore';

export type SettingsBanner = 'idle' | 'sign-in-fail' | 'sign-out-ok' | 'sign-out-fail';

export interface SettingsPageState {
  authStatus: 'loading' | 'signed-out' | 'signed-in';
  displayName: string;
  email: string | null;
  isAnonymous: boolean;
  busyAction: 'none' | 'sign-in' | 'sign-out';
  banner: SettingsBanner;
  canSignIn: boolean;
  canSignOut: boolean;
  goToJoinArena(): void;
  signInGoogle(): Promise<void>;
  signOut(): Promise<void>;
}

export function useSettingsPage(): SettingsPageState {
  const navigate = useNavigate();
  const authStatus = useAuthStore((s) => s.status);
  const displayName = useAuthStore((s) => s.displayName);
  const email = useAuthStore((s) => s.email);
  const isAnonymous = useAuthStore((s) => s.isAnonymous);
  const [busyAction, setBusyAction] = useState<'none' | 'sign-in' | 'sign-out'>('none');
  const [banner, setBanner] = useState<SettingsBanner>('idle');
  const isGoogleSignedIn = authStatus === 'signed-in' && !isAnonymous;

  const canSignIn = authStatus !== 'loading' && !isGoogleSignedIn && busyAction === 'none';
  const canSignOut = isGoogleSignedIn && busyAction === 'none';

  const state = useMemo<SettingsPageState>(
    () => ({
      authStatus,
      displayName,
      email,
      isAnonymous,
      busyAction,
      banner,
      canSignIn,
      canSignOut,
      goToJoinArena() {
        navigate(ROUTES.joinArena);
      },
      async signInGoogle() {
        if (!canSignIn) return;
        setBanner('idle');
        setBusyAction('sign-in');
        try {
          await signInWithGoogleWeb();
        } catch (error) {
          if (import.meta.env.DEV) {
            const code =
              typeof error === 'object' && error && 'code' in error
                ? String((error as { code?: unknown }).code)
                : '';
            console.warn('[settings] google sign-in failed', { code, error });
          }
          setBanner('sign-in-fail');
        } finally {
          setBusyAction('none');
        }
      },
      async signOut() {
        if (!canSignOut) return;
        setBanner('idle');
        setBusyAction('sign-out');
        try {
          await signOutFirebase();
          setBanner('sign-out-ok');
        } catch {
          setBanner('sign-out-fail');
        } finally {
          setBusyAction('none');
        }
      },
    }),
    [authStatus, displayName, email, isAnonymous, busyAction, banner, canSignIn, canSignOut, navigate]
  );

  return state;
}
