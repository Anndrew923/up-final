import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { ROUTES } from '../config/routes';
import { joinArenaPath } from '../lib/joinArenaNavigation';
import i18n, { toSupportedLng, type SupportedLng } from '../i18n';
import { markUserLocaleOverride } from '../i18n/language';
import { resolveMembershipStatus, type MembershipStatusView } from '../logic/core/membershipStatus';
import { SOUND_PIPELINE_TACTICALLY_SILENCED } from '../logic/core/soundGate';
import { deleteSignedInAccount } from '../services/accountDeletionService';
import {
  isNativeAppleSignInAvailable,
  signInWithApple,
  signInWithGoogleWeb,
  signOutFirebase,
} from '../services/firebaseClient';
import { openStoreSubscriptionManagement } from '../services/storeSubscriptionManageService';
import { restorePurchasesFromDevice } from '../services/subscriptionService';
import { sensoryPreferences } from '../services/sensoryPreferences';
import { soundService } from '../services/soundService';
import { useAuthStore } from '../stores/authStore';
import { selectEntitlementState } from '../stores/entitlementSelectors';
import { useEntitlementStore } from '../stores/entitlementStore';
import { useDynoIntelLogStore } from '../stores/dynoIntelLogStore';
import { useBootSequence } from './useBootSequence';
import { useCurrentUserIsAdmin } from './useCurrentUserIsAdmin';

export type SettingsBanner =
  | 'idle'
  | 'sign-in-fail'
  | 'sign-in-apple-fail'
  | 'sign-out-ok'
  | 'sign-out-fail'
  | 'restore-ok'
  | 'restore-empty'
  | 'restore-invalid-expiry'
  | 'restore-sync-failed'
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
  | 'sign-in-apple'
  | 'sign-out'
  | 'restore-purchases'
  | 'delete-account';

export interface SettingsPageState {
  authStatus: 'loading' | 'signed-out' | 'signed-in';
  displayName: string;
  photoURL: string | null;
  email: string | null;
  isAnonymous: boolean;
  isPro: boolean;
  /** Projected membership card state (free / promo / store). */
  membership: MembershipStatusView;
  locale: SupportedLng;
  soundEnabled: boolean;
  /** False while `SOUND_PIPELINE_TACTICALLY_SILENCED` — hides misleading sound toggle. */
  soundSettingsVisible: boolean;
  busyAction: SettingsBusyAction;
  banner: SettingsBanner;
  canSignIn: boolean;
  /** True only on native iOS with Apple auth available (App Store 4.8). */
  showAppleSignIn: boolean;
  canSignOut: boolean;
  canDeleteAccount: boolean;
  canRestorePurchases: boolean;
  /** True only when `users/{uid}.isAdmin === true` — hides admin entry otherwise. */
  isAdmin: boolean;
  /** False until the admin entitlement check finishes (avoids entry flicker). */
  adminCheckReady: boolean;
  dynoIntelLogCount: number;
  goToAbout(): void;
  goToContact(): void;
  goToPrivacyPolicy(): void;
  goToJoinArena(): void;
  /** Membership card unlock / trial-convert — paid Pro funnel, returns to Settings. */
  goToProUpsell(): void;
  goToAdmin(): void;
  reCalibrateBoot(): void;
  toggleLocale(): void;
  toggleSound(): void;
  signInGoogle(): Promise<void>;
  signInApple(): Promise<void>;
  signOut(): Promise<void>;
  restorePurchases(): Promise<void>;
  openManageSubscription(): Promise<void>;
  deleteAccount(): Promise<void>;
  clearDynoIntelHistory(): void;
}

export function useSettingsPage(): SettingsPageState {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { resetBoot } = useBootSequence();
  const authStatus = useAuthStore((s) => s.status);
  const displayName = useAuthStore((s) => s.displayName);
  const photoURL = useAuthStore((s) => s.photoURL);
  const email = useAuthStore((s) => s.email);
  const isAnonymous = useAuthStore((s) => s.isAnonymous);
  const entitlement = useEntitlementStore(useShallow(selectEntitlementState));
  const isPro = entitlement.isPro;
  const membership = useMemo(() => resolveMembershipStatus(entitlement), [entitlement]);
  const dynoIntelLogCount = useDynoIntelLogStore((s) => s.entries.length);
  const clearDynoIntelHistory = useDynoIntelLogStore((s) => s.clearLocalLogs);
  const [busyAction, setBusyAction] = useState<SettingsBusyAction>('none');
  const [banner, setBanner] = useState<SettingsBanner>('idle');
  const [soundEnabled, setSoundEnabled] = useState(() => sensoryPreferences.isSoundEnabled());
  const { isAdmin, ready: adminCheckReady } = useCurrentUserIsAdmin();
  const locale = toSupportedLng(i18n.resolvedLanguage ?? i18n.language);

  const toggleSound = useCallback(() => {
    const next = !sensoryPreferences.isSoundEnabled();
    sensoryPreferences.setSoundEnabled(next);
    setSoundEnabled(next);
    if (!next) {
      soundService.stopAll();
    }
  }, []);
  const isLinkedSignedIn = authStatus === 'signed-in' && !isAnonymous;
  const showAppleSignIn = isNativeAppleSignInAvailable();

  const canSignIn = authStatus !== 'loading' && !isLinkedSignedIn && busyAction === 'none';
  const canSignOut = isLinkedSignedIn && busyAction === 'none';
  const canDeleteAccount = isLinkedSignedIn && busyAction === 'none';
  const canRestorePurchases = authStatus !== 'loading' && busyAction === 'none';

  const state = useMemo<SettingsPageState>(
    () => ({
      authStatus,
      displayName,
      photoURL,
      email,
      isAnonymous,
      isPro,
      membership,
      locale,
      soundEnabled,
      soundSettingsVisible: !SOUND_PIPELINE_TACTICALLY_SILENCED,
      busyAction,
      banner,
      canSignIn,
      showAppleSignIn,
      canSignOut,
      canDeleteAccount,
      canRestorePurchases,
      isAdmin,
      adminCheckReady,
      dynoIntelLogCount,
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
      goToProUpsell() {
        // WHY: Membership unlock/subscribe must use the paid funnel — `settings` inherits
        // ladder early-bird CTA and can skip purchase for Genesis seats.
        navigate(joinArenaPath('pro-upsell', ROUTES.settings));
      },
      goToAdmin() {
        navigate(ROUTES.admin);
      },
      reCalibrateBoot() {
        if (!window.confirm(t('settings.system.reCalibrateConfirm'))) return;
        resetBoot();
        navigate(ROUTES.home, { replace: true });
      },
      toggleLocale() {
        const next: SupportedLng = locale === 'zh-Hant' ? 'en' : 'zh-Hant';
        markUserLocaleOverride(next);
        void i18n.changeLanguage(next);
      },
      toggleSound,
      clearDynoIntelHistory,
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
      async signInApple() {
        if (!canSignIn || !showAppleSignIn) return;
        setBanner('idle');
        setBusyAction('sign-in-apple');
        try {
          await signInWithApple();
        } catch (error) {
          if (import.meta.env.DEV) {
            const code =
              typeof error === 'object' && error && 'code' in error
                ? String((error as { code?: unknown }).code)
                : '';
            console.warn('[settings] apple sign-in failed', { code, error });
          }
          setBanner('sign-in-apple-fail');
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
          if (result.outcome === 'restored' && result.proActive) {
            setBanner('restore-ok');
            return;
          }
          if (result.outcome === 'no_receipt' && result.proActive) {
            setBanner('restore-ok');
            return;
          }
          if (result.outcome === 'invalid_expiry') {
            setBanner('restore-invalid-expiry');
            return;
          }
          if (result.outcome === 'sync_failed') {
            setBanner('restore-sync-failed');
            return;
          }
          if (result.outcome === 'no_receipt') {
            setBanner('restore-empty');
            return;
          }
          setBanner('restore-fail');
        } catch {
          setBanner('restore-fail');
        } finally {
          setBusyAction('none');
        }
      },
      async openManageSubscription() {
        try {
          await openStoreSubscriptionManagement();
        } catch {
          // Store / browser sheet failures are non-fatal; user can retry.
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
      photoURL,
      email,
      isAnonymous,
      isPro,
      membership,
      locale,
      soundEnabled,
      busyAction,
      banner,
      canSignIn,
      showAppleSignIn,
      canSignOut,
      canDeleteAccount,
      canRestorePurchases,
      isAdmin,
      adminCheckReady,
      dynoIntelLogCount,
      clearDynoIntelHistory,
      toggleSound,
      t,
      navigate,
      resetBoot,
    ]
  );

  return state;
}
