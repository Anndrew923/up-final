import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { joinArenaPath } from '../../lib/joinArenaNavigation';
import { hasProAccess } from '../../logic/core/entitlement';
import { selectEntitlementState } from '../../stores/entitlementSelectors';
import { useEntitlementStore } from '../../stores/entitlementStore';
import { useShallow } from 'zustand/react/shallow';

/**
 * Home value card — drives Genesis pioneers (and free users) toward Pro Dyno / Cloud Sync.
 * WHY: Lifetime ladder seats must not imply full Pro; surface the paid delta under the radar.
 */
const HomeProFeatureCard: FC = () => {
  const { t } = useTranslation('common');
  const entitlement = useEntitlementStore(useShallow(selectEntitlementState));
  const isPro = hasProAccess(entitlement);

  if (isPro) {
    return (
      <section
        className="relative overflow-hidden rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-950/50 via-zinc-950/80 to-zinc-950 px-4 py-4"
        aria-label={t('home.proFeatureCard.activeBadge')}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-emerald-400/10 blur-2xl"
          aria-hidden
        />
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-300/90">
          {t('home.proFeatureCard.activeBadge')}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">
          {t('home.proFeatureCard.activeBody')}
        </p>
      </section>
    );
  }

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-amber-400/35 bg-gradient-to-br from-zinc-950 via-zinc-950 to-amber-950/30 px-4 py-4 shadow-[inset_0_1px_0_rgba(251,191,36,0.12)]"
      aria-label={t('home.proFeatureCard.title')}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#fbbf24_1px,transparent_1px),linear-gradient(to_bottom,#fbbf24_1px,transparent_1px)] bg-[length:18px_18px] opacity-[0.07] mix-blend-overlay"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-10 top-0 h-32 w-32 rounded-full bg-amber-400/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-8 bottom-0 h-28 w-28 rounded-full bg-cyan-400/10 blur-3xl"
        aria-hidden
      />

      <div className="relative space-y-3">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-300/90">
            {t('home.proFeatureCard.kicker')}
          </p>
          <h2 className="mt-1.5 text-base font-semibold tracking-tight text-zinc-50">
            {t('home.proFeatureCard.title')}
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">
            {t('home.proFeatureCard.body')}
          </p>
        </div>

        <ul className="space-y-2.5">
          <li className="rounded-xl border border-cyan-400/25 bg-cyan-950/20 px-3 py-2.5">
            <p className="text-sm font-semibold text-cyan-100">
              {t('home.proFeatureCard.dynoTitle')}
            </p>
            <p className="mt-0.5 text-[12px] leading-snug text-zinc-400">
              {t('home.proFeatureCard.dynoBody')}
            </p>
          </li>
          <li className="rounded-xl border border-amber-400/25 bg-amber-950/20 px-3 py-2.5">
            <p className="text-sm font-semibold text-amber-100">
              {t('home.proFeatureCard.cloudTitle')}
            </p>
            <p className="mt-0.5 text-[12px] leading-snug text-zinc-400">
              {t('home.proFeatureCard.cloudBody')}
            </p>
          </li>
        </ul>

        <Link
          to={joinArenaPath('settings')}
          className="ui-btn ui-btn-primary inline-flex w-full items-center justify-center border-amber-400/40 bg-amber-500/15 text-amber-50 hover:bg-amber-500/25"
        >
          {t('home.proFeatureCard.cta')}
        </Link>
      </div>
    </section>
  );
};

export default HomeProFeatureCard;
