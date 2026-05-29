import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import JoinArenaComparisonTable from '../components/arena/JoinArenaComparisonTable';
import JoinArenaProFeatures from '../components/arena/JoinArenaProFeatures';
import { MONETIZATION_CONFIG } from '../config/monetization';
import { ROUTES } from '../config/routes';
import { hasCoreAccess } from '../logic/core/entitlement';
import {
  joinArenaDescriptionKey,
  parseJoinArenaFrom,
} from '../lib/joinArenaNavigation';
import { usePrefersReducedMotion } from '../lib/motionPreference';
import { hapticService } from '../services/hapticService';
import {
  purchaseProSubscription,
  restorePurchasesFromDevice,
} from '../services/subscriptionService';
import { signInWithGoogleWeb } from '../services/firebaseClient';
import { useAuthStore } from '../stores/authStore';
import type { EntitlementState } from '../types/entitlement';
import { useEntitlementStore } from '../stores/entitlementStore';

export interface JoinArenaPageProps {
  onBack?: () => void;
}

const JoinArenaPage: FC<JoinArenaPageProps> = ({ onBack }) => {
  const { t } = useTranslation(['arena', 'common']);
  const navigate = useNavigate();
  const location = useLocation();
  const joinFrom = useMemo(
    () => parseJoinArenaFrom(location.search),
    [location.search]
  );
  const descriptionKey = joinArenaDescriptionKey(joinFrom);

  const [banner, setBanner] = useState<
    'idle' | 'restore-ok' | 'restore-empty' | 'core' | 'auth-ok' | 'auth-fail' | 'billing-fail'
  >('idle');
  const [authBusy, setAuthBusy] = useState(false);
  const [billingBusy, setBillingBusy] = useState(false);

  const isPro = useEntitlementStore((s) => s.isPro);
  const subscriptionStatus = useEntitlementStore((s) => s.subscriptionStatus);
  const authStatus = useAuthStore((s) => s.status);
  const isAnonymous = useAuthStore((s) => s.isAnonymous);
  const signedInDisplayName = useAuthStore((s) => s.displayName);

  const entitlement = useEntitlementStore(
    useShallow(
      (s): EntitlementState => ({
        purchaseStatus: s.purchaseStatus,
        subscriptionStatus: s.subscriptionStatus,
        isPro: s.isPro,
        proExpiresAt: s.proExpiresAt,
        planId: s.planId,
        lastCheckedAt: s.lastCheckedAt,
      })
    )
  );

  const coreOwned = hasCoreAccess(entitlement);
  const isGoogleLinked = authStatus === 'signed-in' && !isAnonymous;
  const paywallEnabled = MONETIZATION_CONFIG.leaderboardPaywallEnabled;
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

  const handleSubscribe = async () => {
    setBanner('idle');
    setBillingBusy(true);
    try {
      if (!paywallEnabled) {
        if (MONETIZATION_CONFIG.leaderboardRequireGoogleSignIn && !isGoogleLinked) {
          navigate(ROUTES.authChoice, { state: { returnTo: ROUTES.ladder } });
          return;
        }
        navigate(ROUTES.ladder);
        return;
      }
      if (!isGoogleLinked) {
        setBanner('auth-fail');
        return;
      }
      if (!coreOwned) {
        setBanner('core');
        return;
      }
      hapticService.triggerProPurchaseIntent();
      const result = await purchaseProSubscription();
      if (!result.ok) {
        if (result.reason === 'core-required') {
          setBanner('core');
        } else if (result.reason === 'auth-required') {
          setBanner('auth-fail');
        } else {
          setBanner('billing-fail');
        }
        return;
      }
      navigate(ROUTES.ladder);
    } finally {
      setBillingBusy(false);
    }
  };

  const handleRestore = async () => {
    setBanner('idle');
    setBillingBusy(true);
    try {
      if (!paywallEnabled) {
        navigate(ROUTES.ladder);
        return;
      }
      const result = await restorePurchasesFromDevice();
      if (!result.hadSnapshot) {
        setBanner('restore-empty');
        return;
      }
      setBanner(result.proActive ? 'restore-ok' : 'restore-empty');
      if (result.proActive) {
        navigate(ROUTES.ladder);
      }
    } finally {
      setBillingBusy(false);
    }
  };

  const subscribeDisabled =
    billingBusy ||
    (paywallEnabled && (!coreOwned || !isGoogleLinked || (subscriptionStatus === 'pro' && isPro)));

  return (
    <main className="relative min-h-screen overflow-hidden bg-bg-base text-zinc-100">
      <div
        className="ui-magitek-grid pointer-events-none absolute inset-0 opacity-[0.07]"
        aria-hidden
      />
      <div className="pointer-events-none absolute -left-24 top-[22%] h-72 w-72 rounded-full bg-accent-primary/15 blur-[100px]" />
      <div className="pointer-events-none absolute -right-32 bottom-12 h-80 w-80 rounded-full bg-accent-info/10 blur-[110px]" />

      <div className="ui-shell-compact relative flex w-full max-w-xl flex-col justify-start gap-6 pb-16 pt-1">
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
            {t('joinTitle')}
          </h1>
          <p className="text-pretty text-sm leading-snug text-zinc-400">{t(descriptionKey)}</p>
        </header>

        {banner === 'core' ? (
          <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {t('coreRequired')}
          </p>
        ) : null}
        {banner === 'restore-ok' ? (
          <p className="rounded-xl border border-sky-500/35 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
            {t('restoreSuccess')}
          </p>
        ) : null}
        {banner === 'restore-empty' ? (
          <p className="rounded-xl border border-zinc-700 bg-bg-card/90 px-4 py-3 text-sm text-zinc-300">
            {t('restoreEmpty')}
          </p>
        ) : null}
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
        {!paywallEnabled ? (
          <p className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {t('betaOpenAccess')}
          </p>
        ) : null}

        <JoinArenaComparisonTable />
        <JoinArenaProFeatures />

        <section className="rounded-2xl border border-zinc-800 bg-bg-card/80 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {t('identityTitle')}
          </p>
          <p className="mt-2 text-sm text-zinc-300">
            {!paywallEnabled
              ? t('identityOptionalBeta')
              : isGoogleLinked
                ? t('signedInAs', { name: signedInDisplayName })
                : t('identityRequired')}
          </p>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={!paywallEnabled || authBusy || isGoogleLinked}
            className="mt-4 rounded-xl border border-zinc-700 bg-zinc-950/80 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {!paywallEnabled
              ? t('betaNoLoginNeeded')
              : authBusy
                ? t('googleLoginLoading')
                : isGoogleLinked
                  ? t('googleLoginDone')
                  : t('googleLogin')}
          </button>
        </section>

        {paywallEnabled && !coreOwned ? (
          <section className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/60 p-5">
            <p className="text-sm text-zinc-300">{t('coreGateBody')}</p>
            <Link
              to={ROUTES.home}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-black transition hover:bg-white"
            >
              {t('coreGateCta')}
            </Link>
          </section>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl border border-zinc-700 bg-zinc-950/80 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
            >
              {t('common:back')}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              void handleRestore();
            }}
            disabled={!paywallEnabled || billingBusy}
            className="rounded-xl border border-accent-info/50 bg-accent-info/10 px-5 py-3 text-sm font-semibold text-accent-info transition hover:bg-accent-info/20"
          >
            {paywallEnabled ? t('restorePurchases') : t('betaRestoreDisabled')}
          </button>
          <button
            type="button"
            onClick={() => {
              void handleSubscribe();
            }}
            disabled={subscribeDisabled}
            className={`group relative min-w-[12rem] flex-1 overflow-hidden rounded-xl border border-accent-primary/80 px-6 py-3.5 text-sm font-bold text-black shadow-[0_0_28px_rgba(255,140,0,0.4)] transition hover:shadow-[0_0_36px_rgba(255,140,0,0.55)] disabled:cursor-not-allowed disabled:border-zinc-700 disabled:shadow-none ${
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
            <span className="relative z-[1]">
              {billingBusy
                ? t('billingLoading')
                : paywallEnabled
                  ? t('subscribeUnlockPro')
                  : t('betaEnterLeaderboard')}
            </span>
          </button>
        </div>
      </div>
    </main>
  );
};

export default JoinArenaPage;
