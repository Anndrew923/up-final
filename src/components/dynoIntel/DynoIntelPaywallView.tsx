import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
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

const DynoIntelPaywallView: FC<DynoIntelPaywallViewProps> = ({
  reason,
  weakestAxisLabel,
  scoreLabel,
  busy,
  billingError,
  onSubscribe,
  onDismiss,
}) => {
  const { t } = useTranslation('common');

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
          {t(`dynoIntel.paywall.body.${reason}`, {
            axis: weakestAxisLabel,
            score: scoreLabel,
          })}
        </p>

        {billingError ? (
          <p className="mt-3 text-sm text-red-300">{t('dynoIntel.paywall.billingFail')}</p>
        ) : null}
      </div>

      <footer className="shrink-0 border-t border-zinc-800/80 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          disabled={busy}
          onClick={onSubscribe}
          className="mb-2 min-h-12 w-full rounded-xl border border-amber-400/50 bg-gradient-to-r from-amber-950/80 via-zinc-900 to-zinc-950 px-4 text-sm font-semibold text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.15)] disabled:opacity-50"
        >
          {busy ? t('dynoIntel.paywall.busy') : t('dynoIntel.paywall.cta')}
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
