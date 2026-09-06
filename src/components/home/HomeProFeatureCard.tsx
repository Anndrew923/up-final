import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CollapsibleChevron } from '../CollapsibleChevron';
import { useHomeProFeatureCardExpanded } from '../../hooks/useHomeProFeatureCardExpanded';
import { onCollapsibleToggleKeyDown } from '../../lib/collapsibleKeyboard';
import { joinArenaPath } from '../../lib/joinArenaNavigation';
import { useEntitlementStore } from '../../stores/entitlementStore';

const PANEL_ID = 'home-pro-feature-panel';
const TOGGLE_ID = 'home-pro-feature-toggle';

/**
 * Pro active micro-card — no collapse preference; keep Home quiet for paying users.
 */
const HomeProFeatureCardActive: FC = () => {
  const { t } = useTranslation('common');

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
};

/**
 * Non-Pro upgrade capsule — collapsed by default so radar → body-data reading stays continuous.
 * WHY: Left text is the sole accessible toggle; chevron is a pointer affordance only
 * (avoids duplicate SR controls). Upgrade Link stays a sibling so it never nests in a button.
 */
const HomeProFeatureCardUpgrade: FC = () => {
  const { t } = useTranslation('common');
  const { isExpanded, toggle } = useHomeProFeatureCardExpanded();
  const toggleLabel = isExpanded
    ? t('home.proFeatureCard.toggleCollapse')
    : t('home.proFeatureCard.toggleExpand');

  return (
    <section
      className={`relative overflow-hidden border border-amber-400/35 bg-gradient-to-br from-zinc-950 via-zinc-950 to-amber-950/30 shadow-[inset_0_1px_0_rgba(251,191,36,0.12)] transition-[border-radius] duration-300 ease-in-out motion-reduce:transition-none ${
        isExpanded ? 'rounded-2xl' : 'rounded-full'
      }`}
      aria-label={t('home.proFeatureCard.title')}
    >
      {isExpanded ? (
        <>
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
        </>
      ) : null}

      <div className="relative grid h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3">
        <button
          type="button"
          id={TOGGLE_ID}
          className="flex min-w-0 items-center gap-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/60"
          aria-expanded={isExpanded}
          aria-controls={PANEL_ID}
          aria-label={toggleLabel}
          onClick={toggle}
          onKeyDown={(e) => onCollapsibleToggleKeyDown(e, toggle)}
        >
          <span className="min-w-0 shrink truncate font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300/90">
            {t('home.proFeatureCard.kicker')}
          </span>
          {!isExpanded ? (
            <span className="min-w-0 truncate text-[12px] text-zinc-400">
              {t('home.proFeatureCard.collapsedSubtitle')}
            </span>
          ) : null}
        </button>

        <div className="flex shrink-0 items-center gap-1.5">
          {!isExpanded ? (
            <Link
              to={joinArenaPath('settings')}
              className="inline-flex h-7 items-center justify-center rounded-full border border-amber-400/45 bg-amber-500/20 px-2.5 text-[11px] font-semibold tracking-wide text-amber-50 transition-colors hover:bg-amber-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/60"
            >
              {t('home.proFeatureCard.collapsedCta')}
            </Link>
          ) : null}
          {/* Pointer affordance only — accessible name / tab stop live on TOGGLE_ID. */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-amber-300/90 transition-colors hover:bg-amber-500/15"
            onClick={toggle}
          >
            <CollapsibleChevron expanded={isExpanded} className="h-4 w-4 shrink-0 text-amber-300/90" />
          </button>
        </div>
      </div>

      {/* Height animates via grid-template-rows — height:auto cannot transition reliably. */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none ${
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div
          className={`min-h-0 overflow-hidden ${isExpanded ? '' : 'pointer-events-none'}`}
          inert={isExpanded ? undefined : true}
        >
          <div
            id={PANEL_ID}
            role="region"
            aria-labelledby={TOGGLE_ID}
            aria-hidden={!isExpanded}
            className="relative space-y-3 px-4 pb-4"
          >
            <div>
              <h2 className="text-base font-semibold tracking-tight text-zinc-50">
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
        </div>
      </div>
    </section>
  );
};

/**
 * Home value card — drives Genesis pioneers (and free users) toward Pro Dyno / Cloud Sync.
 * WHY: Lifetime ladder seats must not imply full Pro; surface the paid delta under the radar.
 * Branch into subcomponents so Pro mounts never touch collapse preference storage.
 */
const HomeProFeatureCard: FC = () => {
  // WHY: store.isPro already mirrors hasProAccess; boolean-only subscribe avoids entitlement churn.
  const isPro = useEntitlementStore((s) => s.isPro);
  return isPro ? <HomeProFeatureCardActive /> : <HomeProFeatureCardUpgrade />;
};

export default HomeProFeatureCard;
