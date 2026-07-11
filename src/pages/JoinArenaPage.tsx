import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import JoinArenaProFeatures from '../components/arena/JoinArenaProFeatures';
import { MONETIZATION_CONFIG } from '../config/monetization';
import { hasCoreAccess } from '../logic/core/entitlement';
import { useUiGate } from '../hooks/useUiGate';
import {
  joinArenaDescriptionKey,
  joinArenaGateFeature,
  parseJoinArenaFrom,
  resolveJoinArenaReturnTo,
} from '../lib/joinArenaNavigation';
import { navigateFromUiGate } from '../lib/uiGateNavigation';
import { usePrefersReducedMotion } from '../lib/motionPreference';
import { hapticService } from '../services/hapticService';
import { purchaseProSubscription } from '../services/subscriptionService';
import { signInWithGoogleWeb } from '../services/firebaseClient';
import { useAuthStore } from '../stores/authStore';
import { useEntitlementStore } from '../stores/entitlementStore';
import { selectEntitlementState } from '../stores/entitlementSelectors';

export interface JoinArenaPageProps {
  onBack?: () => void;
}

const JoinArenaPage: FC<JoinArenaPageProps> = ({ onBack }) => {
  const { t } = useTranslation(['arena', 'common']);
  const navigate = useNavigate();
  const location = useLocation();
  const joinFrom = useMemo(() => parseJoinArenaFrom(location.search), [location.search]);
  const descriptionKey = joinArenaDescriptionKey(joinFrom);
  // WHY: Explicit allowlisted returnTo beats funnel defaults so Dyno never hard-routes to ladder.
  const returnTo = useMemo(
    () => resolveJoinArenaReturnTo(joinFrom, location.search),
    [joinFrom, location.search]
  );
  const isBackupFunnel = joinFrom === 'backup';
  const isDynoFunnel = joinFrom === 'dyno-intel';
  const gateFeature = useMemo(() => joinArenaGateFeature(joinFrom), [joinFrom]);

  const [banner, setBanner] = useState<'idle' | 'auth-ok' | 'auth-fail' | 'billing-fail'>('idle');
  const [authBusy, setAuthBusy] = useState(false);
  const [billingBusy, setBillingBusy] = useState(false);

  const isPro = useEntitlementStore((s) => s.isPro);
  const subscriptionStatus = useEntitlementStore((s) => s.subscriptionStatus);
  const authStatus = useAuthStore((s) => s.status);
  const signedInDisplayName = useAuthStore((s) => s.displayName);

  const entitlement = useEntitlementStore(useShallow(selectEntitlementState));

  const uiGate = useUiGate(gateFeature);
  const coreOwned = hasCoreAccess(entitlement);
  const isBetaOpen = !MONETIZATION_CONFIG.leaderboardPaywallEnabled;
  // WHY: Dyno / backup funnels must not inherit ladder beta copy — context-aware paywall isolation.
  const showLadderBetaBanner = isBetaOpen && !isBackupFunnel && !isDynoFunnel;
  const ctaMotionOn = !usePrefersReducedMotion();

  const handleGoogleSignIn = async () => {
    setBanner('idle');
    setAuthBusy(true);
    try {
      const user = await signInWithGoogleWeb();
      if (user) {
        setBanner('auth-ok');
      }
    } catch {
      setBanner('auth-fail');
    } finally {
      setAuthBusy(false);
    }
  };

  const handlePrimary = async () => {
    setBanner('idle');

    if (uiGate.kind === 'auth') {
      navigateFromUiGate(navigate, uiGate, returnTo);
      return;
    }

    if (uiGate.kind === 'none') {
      navigate(returnTo);
      return;
    }

    setBillingBusy(true);
    try {
      // WHY: Download-includes-Core — client always owns Core; keep assert for defense in depth.
      if (!coreOwned) {
        setBanner('billing-fail');
        return;
      }
      hapticService.triggerProPurchaseIntent();
      const result = await purchaseProSubscription();
      if (!result.ok) {
        if (result.reason === 'auth-required') {
          setBanner('auth-fail');
        } else {
          setBanner('billing-fail');
        }
        return;
      }
      navigate(returnTo);
    } finally {
      setBillingBusy(false);
    }
  };

  const subscribeDisabled =
    billingBusy ||
    authStatus === 'loading' ||
    (uiGate.kind === 'pro' && subscriptionStatus === 'pro' && isPro);

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigate(returnTo);
  };

  const primaryCtaLabel = (() => {
    if (billingBusy || authStatus === 'loading') return t('billingLoading');
    if (isDynoFunnel) {
      if (uiGate.kind === 'auth') return t('googleLogin');
      if (uiGate.kind === 'none') return t('returnToDynoIntel');
      return t('subscribeUnlockProDynoIntel');
    }
    if (uiGate.kind === 'auth') {
      return isBackupFunnel
        ? t('googleLogin')
        : isBetaOpen
          ? t('betaEnterLeaderboard')
          : t('googleLogin');
    }
    if (uiGate.kind === 'none') {
      return isBackupFunnel
        ? t('returnToCloudSync')
        : isBetaOpen
          ? t('betaEnterLeaderboard')
          : t('enterLeaderboard');
    }
    return isBackupFunnel ? t('unlockProCloudSync') : t('subscribeUnlockPro');
  })();

  return (
    <main className="ui-shell-compact relative flex w-full max-w-xl flex-col justify-start gap-6 bg-bg-base pb-16 pt-1 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="ui-magitek-grid absolute inset-0 opacity-[0.07]" />
        <div className="absolute -left-24 top-[22%] h-72 w-72 rounded-full bg-accent-primary/15 blur-[100px]" />
        <div className="absolute -right-32 bottom-12 h-80 w-80 rounded-full bg-accent-info/10 blur-[110px]" />
      </div>

      {onBack ? (
        <button
          type="button"
          onClick={handleBack}
          aria-label={t('common:back')}
          className="absolute left-0 top-0 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800/80 bg-zinc-950/70 text-lg text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-100"
        >
          ←
        </button>
      ) : null}

      <header className="space-y-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-accent-info">
          {t('magitekKicker')}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-accent-primary/50 bg-accent-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-accent-primary">
            {t('proBadge')}
          </span>
          {isPro ? <span className="text-xs text-emerald-400">{t('activeProBadge')}</span> : null}
        </div>
        <h1 className="bg-gradient-to-r from-zinc-50 via-accent-primary to-zinc-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent drop-shadow-[0_0_28px_rgba(255,140,0,0.35)]">
          {isDynoFunnel ? t('joinTitleFromDynoIntel') : t('joinTitle')}
        </h1>
        <p className="text-pretty text-sm leading-snug text-zinc-400">{t(descriptionKey)}</p>
      </header>

      {banner === 'auth-ok' ? (
        <p className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {t('googleLoginSuccess', { name: signedInDisplayName })}
        </p>
      ) : null}
      {banner === 'auth-fail' ? (
        <p className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {t('googleLoginFail')}
        </p>
      ) : null}
      {banner === 'billing-fail' ? (
        <p className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {t('billingUnavailable')}
        </p>
      ) : null}
      {showLadderBetaBanner ? (
        <p
          role="status"
          className="rounded-xl border-2 border-emerald-400/50 bg-emerald-500/15 px-5 py-4 text-base font-semibold leading-snug text-emerald-50 shadow-[0_0_24px_rgba(52,211,153,0.15)]"
        >
          {t('betaOpenAccess')}
        </p>
      ) : null}

      {/* WHY: Single Pro kit panel — Core/Pro comparison removed to kill duplicate feature narrative. */}
      <JoinArenaProFeatures />

      <section className="rounded-2xl border border-zinc-800 bg-bg-card/80 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {t('identityTitle')}
        </p>
        <p className="mt-2 text-sm text-zinc-300">
          {uiGate.kind === 'auth'
            ? isBackupFunnel || isDynoFunnel
              ? t('identityRequired')
              : isBetaOpen
                ? t('identityOptionalBeta')
                : t('identityRequired')
            : t('signedInAs', { name: signedInDisplayName })}
        </p>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={authBusy || uiGate.kind !== 'auth'}
          className="mt-4 rounded-xl border border-zinc-700 bg-zinc-950/80 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uiGate.kind !== 'auth'
            ? t('googleLoginDone')
            : authBusy
              ? t('googleLoginLoading')
              : t('googleLogin')}
        </button>
      </section>

      <section className="flex w-full flex-col items-stretch gap-3 pt-2">
        <button
          type="button"
          onClick={() => {
            void handlePrimary();
          }}
          disabled={subscribeDisabled}
          className={`group relative w-full overflow-hidden rounded-xl border border-accent-primary/80 px-6 py-3.5 text-sm font-bold text-black shadow-[0_0_28px_rgba(255,140,0,0.4)] transition hover:shadow-[0_0_36px_rgba(255,140,0,0.55)] disabled:cursor-not-allowed disabled:border-zinc-700 disabled:shadow-none ${
            subscribeDisabled ? 'bg-zinc-800 text-zinc-500' : ''
          }`}
        >
          {!subscribeDisabled ? (
            <>
              <span
                className={`pointer-events-none absolute inset-0 bg-gradient-to-r from-accent-primary via-amber-300 to-orange-500 bg-[length:200%_200%] ${
                  ctaMotionOn ? 'animate-arena-cta-shimmer' : ''
                }`}
                aria-hidden
              />
              <span
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_45%)] opacity-60"
                aria-hidden
              />
            </>
          ) : null}
          <span className="relative z-[1]">{primaryCtaLabel}</span>
        </button>
      </section>
    </main>
  );
};

export default JoinArenaPage;
