import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { joinArenaPath } from '../lib/joinArenaNavigation';
import i18n, { toSupportedLng, type SupportedLng } from '../i18n';
import { deleteSignedInAccount } from '../services/accountDeletionService';
import { signInWithGoogleWeb, signOutFirebase } from '../services/firebaseClient';
import { restorePurchasesFromDevice } from '../services/subscriptionService';
import { useBootSequence } from './useBootSequence';
import { useAuthStore } from '../stores/authStore';

export type SettingsBanner =
  | 'idle'
  | 'sign-in-fail'
  | 'sign-out-ok'
  | 'sign-out-fail'
  | 'restore-ok'
  | 'restore-empty'
  | 'restore-fail'
  | 'delete-success'
  | 'delete-requires-recent-login'
  | 'delete-reauth-fail'
  | 'delete-cloud-partial'
  | 'delete-auth-fail'
  | 'delete-not-allowed';

export type SettingsBusyAction =
  | 'none'
  | 'sign-in'
  | 'sign-out'
  | 'restore-purchases'
  | 'delete-account';

export interface SettingsPageState {
  authStatus: 'loading' | 'signed-out' | 'signed-in';
  displayName: string;
  email: string | null;
  isAnonymous: boolean;
  locale: SupportedLng;
  busyAction: SettingsBusyAction;
  banner: SettingsBanner;
  canSignIn: boolean;
  canSignOut: boolean;
  canDeleteAccount: boolean;
  canRestorePurchases: boolean;
  goToAbout(): void;
  goToContact(): void;
  goToPrivacyPolicy(): void;
  goToJoinArena(): void;
  reCalibrateBoot(): void;
  toggleLocale(): void;
  signInGoogle(): Promise<void>;
  signOut(): Promise<void>;
  restorePurchases(): Promise<void>;
  deleteAccount(): Promise<void>;
}

export function useSettingsPage(): SettingsPageState {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { resetBoot } = useBootSequence();
  const authStatus = useAuthStore((s) => s.status);
  const displayName = useAuthStore((s) => s.displayName);
  const email = useAuthStore((s) => s.email);
  const isAnonymous = useAuthStore((s) => s.isAnonymous);
  const [busyAction, setBusyAction] = useState<SettingsBusyAction>('none');
  const [banner, setBanner] = useState<SettingsBanner>('idle');
  const locale = toSupportedLng(i18n.resolvedLanguage ?? i18n.language);
  const isGoogleSignedIn = authStatus === 'signed-in' && !isAnonymous;

  const canSignIn = authStatus !== 'loading' && !isGoogleSignedIn && busyAction === 'none';
  const canSignOut = isGoogleSignedIn && busyAction === 'none';
  const canDeleteAccount = isGoogleSignedIn && busyAction === 'none';
  const canRestorePurchases = authStatus !== 'loading' && busyAction === 'none';

  const state = useMemo<SettingsPageState>(
    () => ({
      authStatus,
      displayName,
      email,
      isAnonymous,
      locale,
      busyAction,
      banner,
      canSignIn,
      canSignOut,
      canDeleteAccount,
      canRestorePurchases,
      goToAbout() {
        navigate(ROUTES.about);
      },
      goToContact() {
        navigate(ROUTES.contact);
      },
      goToPrivacyPolicy() {
        navigate(ROUTES.privacyPolicy);
      },
      goToJoinArena() {
        navigate(joinArenaPath('settings'));
      },
      reCalibrateBoot() {
        resetBoot();
        navigate(ROUTES.home, { replace: true });
      },
      toggleLocale() {
        const next: SupportedLng = locale === 'zh-Hant' ? 'en' : 'zh-Hant';
        void i18n.changeLanguage(next);
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
      async restorePurchases() {
        if (!canRestorePurchases) return;
        setBanner('idle');
        setBusyAction('restore-purchases');
        try {
          const result = await restorePurchasesFromDevice();
          if (!result.hadSnapshot) {
            setBanner('restore-empty');
            return;
          }
          if (result.proActive) {
            setBanner('restore-ok');
            return;
          }
          setBanner('restore-empty');
        } catch {
          setBanner('restore-fail');
        } finally {
          setBusyAction('none');
        }
      },
      async deleteAccount() {
        if (!canDeleteAccount) {
          setBanner('delete-not-allowed');
          return;
        }
        const accepted = window.confirm(t('settings.deleteConfirm', { ns: 'common' }));
        if (!accepted) return;

        setBanner('idle');
        setBusyAction('delete-account');
        const result = await deleteSignedInAccount();
        if (result.ok) {
          setBanner('delete-success');
          navigate(ROUTES.authChoice, { replace: true });
          setBusyAction('none');
          return;
        }

        if (result.code === 'auth/requires-recent-login') {
          setBanner('delete-requires-recent-login');
        } else if (result.code === 'reauth-fail') {
          setBanner('delete-reauth-fail');
        } else if (result.code === 'cloud-delete-partial') {
          setBanner('delete-cloud-partial');
          navigate(ROUTES.authChoice, { replace: true });
        } else if (
          result.code === 'auth-delete-fail' ||
          result.code === 'auth-not-ready' ||
          result.code === 'local-cleanup-fail'
        ) {
          setBanner('delete-auth-fail');
        } else {
          setBanner('delete-not-allowed');
        }
        setBusyAction('none');
      },
    }),
    [
      authStatus,
      displayName,
      email,
      isAnonymous,
      locale,
      busyAction,
      banner,
      canSignIn,
      canSignOut,
      canDeleteAccount,
      canRestorePurchases,
      t,
      navigate,
      resetBoot,
    ]
  );

  return state;
}
