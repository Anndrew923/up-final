import type { FC } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { ROUTES } from '../config/routes';
import { hasCoreAccess } from '../logic/core/entitlement';
import {
  purchaseProSubscription,
  restorePurchasesFromDevice,
} from '../services/subscriptionService';
import type { EntitlementState } from '../types/entitlement';
import { useEntitlementStore } from '../stores/entitlementStore';

export interface JoinArenaPageProps {
  onBack?: () => void;
}

const JoinArenaPage: FC<JoinArenaPageProps> = ({ onBack }) => {
  const { t } = useTranslation(['arena', 'common']);
  const navigate = useNavigate();
  const [banner, setBanner] = useState<'idle' | 'restore-ok' | 'restore-empty' | 'core'>('idle');

  const isPro = useEntitlementStore((s) => s.isPro);
  const subscriptionStatus = useEntitlementStore((s) => s.subscriptionStatus);

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

  const handleSubscribe = () => {
    setBanner('idle');
    if (!coreOwned) {
      setBanner('core');
      return;
    }
    const result = purchaseProSubscription();
    if (!result.ok) {
      if (result.reason === 'core-required') {
        setBanner('core');
      }
      return;
    }
    navigate(ROUTES.ladder);
  };

  const handleRestore = () => {
    setBanner('idle');
    const result = restorePurchasesFromDevice();
    if (!result.hadSnapshot) {
      setBanner('restore-empty');
      return;
    }
    setBanner(result.proActive ? 'restore-ok' : 'restore-empty');
    if (result.proActive) {
      navigate(ROUTES.ladder);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-bg-base text-zinc-100">
      <div
        className="ui-magitek-grid pointer-events-none absolute inset-0 opacity-[0.07]"
        aria-hidden
      />
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-accent-primary/15 blur-[100px]" />
      <div className="pointer-events-none absolute -right-32 bottom-12 h-80 w-80 rounded-full bg-accent-info/10 blur-[110px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-8 px-6 py-14">
        <header className="space-y-3">
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
          <p className="text-sm leading-relaxed text-zinc-400">{t('joinDescription')}</p>
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

        <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-bg-card/80 shadow-panel backdrop-blur-md">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-info/60 to-transparent" />
          <div className="space-y-5 p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              {t('featuresTitle')}
            </h2>
            <ul className="space-y-4">
              <li className="flex gap-3 text-sm text-zinc-200">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-accent-primary shadow-[0_0_12px_rgba(255,140,0,0.8)]" />
                <span>{t('proFeatureLeaderboard')}</span>
              </li>
              <li className="flex gap-3 text-sm text-zinc-200">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-accent-info shadow-[0_0_12px_rgba(0,191,255,0.7)]" />
                <span>{t('proFeatureCloudSync')}</span>
              </li>
              <li className="flex gap-3 text-sm text-zinc-200">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.55)]" />
                <span>{t('proFeatureArena')}</span>
              </li>
            </ul>
            <p className="border-t border-zinc-800/80 pt-4 text-xs leading-relaxed text-zinc-500">
              {t('disclaimer')}
            </p>
          </div>
        </section>

        {!coreOwned ? (
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
            onClick={handleRestore}
            className="rounded-xl border border-accent-info/50 bg-accent-info/10 px-5 py-3 text-sm font-semibold text-accent-info transition hover:bg-accent-info/20"
          >
            {t('restorePurchases')}
          </button>
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={!coreOwned || (subscriptionStatus === 'pro' && isPro)}
            className="rounded-xl border border-accent-primary bg-accent-primary px-6 py-3 text-sm font-bold text-black shadow-[0_0_24px_rgba(255,140,0,0.35)] transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none"
          >
            {t('subscribeNow')}
          </button>
        </div>
      </div>
    </main>
  );
};

export default JoinArenaPage;
