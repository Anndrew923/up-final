import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import JoinArenaFloatingCta from '../components/arena/JoinArenaFloatingCta';
import JoinArenaPlanPicker from '../components/arena/JoinArenaPlanPicker';
import JoinArenaProFeatures from '../components/arena/JoinArenaProFeatures';
import ProSubscriptionResultModal, {
  type ProSubscriptionFailureReason,
  type ProSubscriptionResultKind,
} from '../components/arena/ProSubscriptionResultModal';
import PromoCodeRedeemPanel from '../components/promo/PromoCodeRedeemPanel';
import ProBadge from '../components/ProBadge';
import UserProIdentityRow from '../components/UserProIdentityRow';
import { MONETIZATION_CONFIG } from '../config/monetization';
import {
  DEFAULT_PRO_SUBSCRIPTION_PLAN,
  type ProSubscriptionPlanId,
} from '../config/proSubscriptionPlans';
import { hasCoreAccess, isValidActiveProExpiry } from '../logic/core/entitlement';
import { resolveIdentityInitial } from '../logic/core/identity';
import { mapPurchaseProFailureToUi } from '../logic/core/purchaseProUiFailure';
import { useGenesisSeatSummary } from '../hooks/useGenesisSeatSummary';
import { useUiGate } from '../hooks/useUiGate';
import { formatGenesisSeatSummaryCopy } from '../lib/genesisSeatSummaryCopy';
import {
  isProSubscribeFunnel,
  joinArenaDescriptionKey,
  joinArenaGateFeature,
  joinArenaTitleKey,
  parseJoinArenaFrom,
  resolveJoinArenaReturnTo,
} from '../lib/joinArenaNavigation';
import { resolveJoinArenaPrimaryCtaKey } from '../lib/joinArenaPrimaryCta';
import { navigateFromUiGate } from '../lib/uiGateNavigation';
import { usePrefersReducedMotion } from '../lib/motionPreference';
import { openStoreSubscriptionManagement } from '../services/storeSubscriptionManageService';
import { purchaseProSubscription } from '../services/subscriptionService';
import {
  isNativeAppleSignInAvailable,
  signInWithApple,
  signInWithGoogleWeb,
} from '../services/firebaseClient';
import { useAuthStore } from '../stores/authStore';
import { useEntitlementStore } from '../stores/entitlementStore';
import { selectEntitlementState } from '../stores/entitlementSelectors';

type ResultModalState =
  | { open: false }
  | {
      open: true;
      kind: ProSubscriptionResultKind;
      failureReason?: ProSubscriptionFailureReason;
    };

const JoinArenaPage: FC = () => {
  const { t } = useTranslation(['arena', 'common']);
  const navigate = useNavigate();
  const location = useLocation();
  const joinFrom = useMemo(() => parseJoinArenaFrom(location.search), [location.search]);
  const descriptionKey = joinArenaDescriptionKey(joinFrom);
  const titleKey = joinArenaTitleKey(joinFrom);
  // WHY: Explicit allowlisted returnTo beats funnel defaults so Dyno never hard-routes to ladder.
  const returnTo = useMemo(
    () => resolveJoinArenaReturnTo(joinFrom, location.search),
    [joinFrom, location.search]
  );
  // WHY: Home / Dyno / backup are paid Pro funnels — never inherit ladder "early bird free" CTA.
  const proSubscribeFunnel = isProSubscribeFunnel(joinFrom);
  const gateFeature = useMemo(() => joinArenaGateFeature(joinFrom), [joinFrom]);

  const [banner, setBanner] = useState<'idle' | 'auth-ok' | 'apple-ok'>('idle');
  const [resultModal, setResultModal] = useState<ResultModalState>({ open: false });
  const [authBusy, setAuthBusy] = useState(false);
  const [billingBusy, setBillingBusy] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ProSubscriptionPlanId>(
    DEFAULT_PRO_SUBSCRIPTION_PLAN
  );
  const showAppleSignIn = isNativeAppleSignInAvailable();

  const isPro = useEntitlementStore((s) => s.isPro);
  const isGenesisEarlyBird = useEntitlementStore((s) => s.isGenesisEarlyBird === true);
  const storeBillingExpiresAt = useEntitlementStore((s) => s.proExpiresAt);
  const authStatus = useAuthStore((s) => s.status);
  const signedInDisplayName = useAuthStore((s) => s.displayName);
  const signedInEmail = useAuthStore((s) => s.email);
  const photoURL = useAuthStore((s) => s.photoURL);

  const entitlement = useEntitlementStore(useShallow(selectEntitlementState));
  const genesisSeatSummary = useGenesisSeatSummary();

  const uiGate = useUiGate(gateFeature);
  const coreOwned = hasCoreAccess(entitlement);
  const isBetaOpen = !MONETIZATION_CONFIG.leaderboardPaywallEnabled;
  // WHY: Ladder FOMO strip only for ladder/settings entry — Pro funnels use pioneer upsell banner instead.
  const showLadderBetaBanner = !proSubscribeFunnel;
  const showGenesisPioneerProBanner = proSubscribeFunnel && isGenesisEarlyBird;

  const genesisBannerText = useMemo(
    () => formatGenesisSeatSummaryCopy(t, genesisSeatSummary),
    [genesisSeatSummary, t]
  );
  const ctaMotionOn = !usePrefersReducedMotion();
  // WHY: Promo-only Pro must still see plans — only active store billing blocks repurchase.
  const hasActiveStoreBilling = isValidActiveProExpiry(storeBillingExpiresAt);
  const showPlanPicker = authStatus === 'signed-in' && !hasActiveStoreBilling;
  const promoOnlyConvert = isPro && !hasActiveStoreBilling;

  const handleGoogleSignIn = async () => {
    setBanner('idle');
    setAuthBusy(true);
    try {
      const user = await signInWithGoogleWeb();
      if (user) {
        setBanner('auth-ok');
      }
    } catch {
      setResultModal({ open: true, kind: 'failure', failureReason: 'auth' });
    } finally {
      setAuthBusy(false);
    }
  };

  const handleAppleSignIn = async () => {
    setBanner('idle');
    setAuthBusy(true);
    try {
      const user = await signInWithApple();
      if (user) {
        setBanner('apple-ok');
      }
    } catch {
      setResultModal({ open: true, kind: 'failure', failureReason: 'auth' });
    } finally {
      setAuthBusy(false);
    }
  };

  const runPurchase = async () => {
    setBillingBusy(true);
    try {
      // WHY: Download-includes-Core — client always owns Core; keep assert for defense in depth.
      if (!coreOwned) {
        setResultModal({ open: true, kind: 'failure', failureReason: 'core' });
        return;
      }
      const result = await purchaseProSubscription(selectedPlan);
      if (!result.ok) {
        setResultModal({
          open: true,
          kind: 'failure',
          failureReason: mapPurchaseProFailureToUi(result.reason),
        });
        return;
      }
      setResultModal({ open: true, kind: 'success' });
    } finally {
      setBillingBusy(false);
    }
  };

  const handlePrimary = async () => {
    setBanner('idle');

    if (uiGate.kind === 'auth') {
      // WHY: On iOS, primary CTA uses Apple directly (guideline 4.8); Android keeps auth-choice route.
      if (showAppleSignIn) {
        await handleAppleSignIn();
        return;
      }
      navigateFromUiGate(navigate, uiGate, returnTo);
      return;
    }

    // WHY: Pro subscribe funnel + visible plan picker must purchase even when uiGate is `none`
    // (genesis / open ladder). Navigating returnTo here was the conversion break.
    if (proSubscribeFunnel && showPlanPicker) {
      await runPurchase();
      return;
    }

    if (uiGate.kind === 'none' && !promoOnlyConvert) {
      navigate(returnTo);
      return;
    }

    await runPurchase();
  };

  const subscribeDisabled =
    billingBusy || authBusy || authStatus === 'loading' || hasActiveStoreBilling;

  const primaryCtaLabel = t(
    resolveJoinArenaPrimaryCtaKey({
      from: joinFrom,
      busy: billingBusy || authBusy || authStatus === 'loading',
      showPlanPicker,
      promoOnlyConvert,
      uiGateKind: uiGate.kind,
      showAppleSignIn,
      isBetaOpen,
    })
  );

  return (
    <>
      <main className="ui-shell-compact relative flex w-full max-w-xl flex-col justify-start gap-6 bg-bg-base pt-1 text-zinc-100">
        {/* WHY: Page uses ui-shell-compact (no extra top pad) while AppShell applies full pt-shell-top —
            Join Arena is intentionally NOT in isCompactShellRoutePath so HUD back clears the kicker. */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
          <div className="ui-magitek-grid absolute inset-0 opacity-[0.07]" />
          <div className="absolute -left-24 top-[22%] h-72 w-72 rounded-full bg-accent-primary/15 blur-[100px]" />
          <div className="absolute -right-32 bottom-12 h-80 w-80 rounded-full bg-accent-info/10 blur-[110px]" />
        </div>

        <header className="space-y-2.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-accent-info">
            {t('magitekKicker')}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {/* WHY: Header stays product brand (subtle); metal honor mark lives on identity row only. */}
            <ProBadge size="sm" variant="subtle" />
            {isPro ? <span className="text-xs text-emerald-400">{t('activeProBadge')}</span> : null}
          </div>
          <h1 className="bg-gradient-to-r from-zinc-50 via-accent-primary to-zinc-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent drop-shadow-[0_0_28px_rgba(255,140,0,0.35)]">
            {t(titleKey)}
          </h1>
          {/* WHY: Paid funnels jump title → spec sheet; long blurbs steal fold space from plans/CTA. */}
          {!proSubscribeFunnel ? (
            <p className="text-pretty text-sm leading-snug text-zinc-400">{t(descriptionKey)}</p>
          ) : null}
        </header>

        {banner === 'auth-ok' ? (
          <p className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {t('googleLoginSuccess', { name: signedInDisplayName })}
          </p>
        ) : null}
        {banner === 'apple-ok' ? (
          <p className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {t('appleLoginSuccess', { name: signedInDisplayName })}
          </p>
        ) : null}
        {showGenesisPioneerProBanner ? (
          <p
            role="status"
            className="rounded-xl border-2 border-emerald-400/50 bg-emerald-500/15 px-5 py-4 text-base font-semibold leading-snug text-emerald-50 shadow-[0_0_24px_rgba(52,211,153,0.15)]"
          >
            {t('genesisPioneerProUpsellBanner')}
          </p>
        ) : null}
        {showLadderBetaBanner ? (
          <p
            role="status"
            className={`rounded-xl border-2 px-5 py-4 text-base font-semibold leading-snug shadow-[0_0_24px_rgba(52,211,153,0.15)] ${
              genesisSeatSummary.stage === 'closing'
                ? 'border-amber-400/55 bg-amber-500/15 text-amber-50'
                : genesisSeatSummary.stage === 'ended'
                  ? 'border-zinc-500/50 bg-zinc-800/40 text-zinc-200 shadow-none'
                  : 'border-emerald-400/50 bg-emerald-500/15 text-emerald-50'
            }`}
          >
            {genesisBannerText}
          </p>
        ) : null}

        {/* WHY: Compact Pro checklist — de-boxed so plan picker / invite code stay above the fold. */}
        <JoinArenaProFeatures />

        {showPlanPicker ? (
          <JoinArenaPlanPicker
            selected={selectedPlan}
            onSelect={setSelectedPlan}
            disabled={billingBusy || authBusy}
          />
        ) : null}

        {authStatus === 'signed-in' ? <PromoCodeRedeemPanel variant="link" /> : null}

        <section className="rounded-2xl border border-zinc-800 bg-bg-card/80 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {t('identityTitle')}
          </p>
          {uiGate.kind === 'auth' ? (
            <div className="mt-2 space-y-3">
              <p className="text-sm text-zinc-300">
                {proSubscribeFunnel
                  ? t(showAppleSignIn ? 'identityRequiredApple' : 'identityRequired')
                  : isBetaOpen
                    ? t(showAppleSignIn ? 'identityOptionalBetaApple' : 'identityOptionalBeta')
                    : t(showAppleSignIn ? 'identityRequiredApple' : 'identityRequired')}
              </p>
              {/* WHY: Secondary Google on iOS only — primary floating CTA already runs Apple. */}
              {showAppleSignIn ? (
                <button
                  type="button"
                  className="ui-btn w-full justify-center"
                  disabled={authBusy || billingBusy}
                  onClick={() => {
                    void handleGoogleSignIn();
                  }}
                >
                  {t('googleLogin')}
                </button>
              ) : null}
            </div>
          ) : (
            <UserProIdentityRow
              className="mt-3"
              isPro={isPro}
              avatarSize="md"
              avatarUrl={photoURL}
              avatarFallback={resolveIdentityInitial(signedInDisplayName, signedInEmail)}
              name={t('signedInAs', { name: signedInDisplayName })}
              nameClassName="text-sm text-zinc-200"
            />
          )}
        </section>

        {/* WHY: De-emphasized vs purchase path — store manage must not compete with plan/CTA. */}
        <button
          type="button"
          className="mx-auto block text-xs text-zinc-500 underline underline-offset-2 transition hover:text-zinc-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500"
          onClick={() => {
            void openStoreSubscriptionManagement().catch(() => {
              // Store / browser sheet failures are non-fatal; user can retry.
            });
          }}
        >
          {t('manageSubscription')}
        </button>

        <ProSubscriptionResultModal
          open={resultModal.open}
          kind={resultModal.open ? resultModal.kind : 'failure'}
          failureReason={resultModal.open ? resultModal.failureReason : 'billing'}
          onRetry={() => {
            const reason = resultModal.open ? resultModal.failureReason : 'billing';
            setResultModal({ open: false });
            if (reason === 'auth') {
              if (showAppleSignIn) {
                void handleAppleSignIn();
                return;
              }
              void handleGoogleSignIn();
              return;
            }
            void runPurchase();
          }}
          onBrowse={() => {
            setResultModal({ open: false });
            navigate(returnTo);
          }}
          onSuccessContinue={() => {
            setResultModal({ open: false });
            navigate(returnTo);
          }}
        />
      </main>

      <JoinArenaFloatingCta
        label={primaryCtaLabel}
        disabled={subscribeDisabled}
        motionOn={ctaMotionOn}
        onClick={() => {
          void handlePrimary();
        }}
      />
    </>
  );
};

export default JoinArenaPage;
