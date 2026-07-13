import type { FC } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { usePrefersReducedMotion } from '../../lib/motionPreference';
import type { DynoIntelPaywallReason } from '../../types/dynoIntelPaywall';

export interface DynoIntelPaywallViewProps {
  reason: DynoIntelPaywallReason;
  weakestAxisLabel: string;
  scoreLabel: string;
  busy: boolean;
  billingError: boolean;
  onSubscribe: () => void;
  onDismiss: () => void;
}

const FEATURE_ROWS = [
  { key: 'ladder', dot: 'bg-accent-primary shadow-[0_0_8px_rgba(255,140,0,0.9)]' },
  { key: 'cloud', dot: 'bg-accent-info shadow-[0_0_8px_rgba(0,191,255,0.9)]' },
  { key: 'dyno', dot: 'bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.9)]' },
] as const;

/** WHY: Highlight 2 vs 30 quota contrast without hardcoding styled numerals in JSX. */
const PAYWALL_BODY_COMPONENTS = {
  cyan: <span className="text-cyan-400 font-bold shadow-[0_0_8px_rgba(34,211,238,0.2)]" />,
  bold: <span className="text-zinc-100 font-semibold" />,
};

const DynoIntelPaywallView: FC<DynoIntelPaywallViewProps> = ({
  reason,
  busy,
  billingError,
  onSubscribe,
  onDismiss,
}) => {
  const { t } = useTranslation('common');
  const ctaMotionOn = !usePrefersReducedMotion();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [-webkit-overflow-scrolling:touch]">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-950/40 px-3 py-1">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-cyan-200">
            {t('dynoIntel.paywall.badge')}
          </span>
        </div>

        <h3 className="text-base font-semibold tracking-tight text-zinc-50">
          {t(`dynoIntel.paywall.title.${reason}`)}
        </h3>

        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
          <Trans
            ns="common"
            i18nKey={`dynoIntel.paywall.body.${reason}`}
            components={PAYWALL_BODY_COMPONENTS}
          />
        </p>

        <div className="mt-4 rounded-xl border border-accent-primary/30 bg-zinc-950/70 p-3.5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-primary/90">
            {t('dynoIntel.paywall.featuresTitle')}
          </p>
          <ul className="mt-3 space-y-3">
            {FEATURE_ROWS.map((row) => (
              <li key={row.key} className="flex gap-2.5">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${row.dot}`} aria-hidden />
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-semibold tracking-tight text-zinc-50 text-pretty">
                    {t(`dynoIntel.paywall.features.${row.key}.title`)}
                  </p>
                  <p className="text-[13px] leading-snug text-zinc-400 text-pretty">
                    {t(`dynoIntel.paywall.features.${row.key}.body`)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-zinc-800/80 pt-3 font-mono text-sm font-semibold tracking-wide text-amber-200">
            {t('dynoIntel.paywall.price')}
          </p>
        </div>

        {billingError ? (
          <p className="mt-3 text-sm text-red-300">{t('dynoIntel.paywall.billingFail')}</p>
        ) : null}
      </div>

      <footer className="shrink-0 border-t border-zinc-800/80 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          disabled={busy}
          onClick={onSubscribe}
          className={`group relative mb-2 min-h-12 w-full overflow-hidden rounded-xl border border-orange-400/90 px-4 text-sm font-bold text-black shadow-[0_0_28px_rgba(255,100,0,0.55),0_0_48px_rgba(255,60,0,0.25)] transition hover:shadow-[0_0_36px_rgba(255,120,0,0.7),0_0_56px_rgba(255,40,0,0.35)] disabled:cursor-not-allowed disabled:border-zinc-700 disabled:shadow-none ${
            busy ? 'bg-zinc-800 text-zinc-500' : ''
          }`}
        >
          {!busy ? (
            <>
              <span
                className={`pointer-events-none absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-400 to-red-500 bg-[length:200%_200%] ${
                  ctaMotionOn ? 'animate-arena-cta-shimmer' : ''
                }`}
                aria-hidden
              />
              <span
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.45),transparent_45%)] opacity-70"
                aria-hidden
              />
            </>
          ) : null}
          <span className="relative z-[1]">
            {busy ? t('dynoIntel.paywall.busy') : t('dynoIntel.paywall.cta')}
          </span>
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onDismiss}
          className="min-h-10 w-full rounded-xl border border-zinc-700 px-4 text-sm text-zinc-400"
        >
          {t('dynoIntel.paywall.dismiss')}
        </button>
      </footer>
    </div>
  );
};

export default DynoIntelPaywallView;
