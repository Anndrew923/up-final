import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PRO_SUBSCRIPTION_PLANS,
  type ProSubscriptionPlanId,
} from '../../config/proSubscriptionPlans';

export interface JoinArenaPlanPickerProps {
  selected: ProSubscriptionPlanId;
  onSelect: (plan: ProSubscriptionPlanId) => void;
  disabled?: boolean;
}

/**
 * Dual-track Pro plan cards — annual (default, left) vs monthly.
 * WHY: Presentational only; purchase orchestration stays in JoinArenaPage / subscriptionService.
 */
const JoinArenaPlanPicker: FC<JoinArenaPlanPickerProps> = ({
  selected,
  onSelect,
  disabled = false,
}) => {
  const { t } = useTranslation('arena');

  const cards: Array<{
    id: ProSubscriptionPlanId;
    price: string;
    period: string;
    badge?: string;
    hint?: string;
  }> = [
    {
      id: 'annual',
      price: `$${PRO_SUBSCRIPTION_PLANS.annual.priceUsd.toFixed(2)}`,
      period: t('planAnnualPeriod'),
      badge: t('planAnnualBadge', { percent: PRO_SUBSCRIPTION_PLANS.annual.savingsPercent }),
      hint: t('planAnnualHint', {
        monthly: PRO_SUBSCRIPTION_PLANS.annual.monthlyEquivalentUsd.toFixed(2),
      }),
    },
    {
      id: 'monthly',
      price: `$${PRO_SUBSCRIPTION_PLANS.monthly.priceUsd.toFixed(2)}`,
      period: t('planMonthlyPeriod'),
    },
  ];

  return (
    <section className="space-y-3" aria-label={t('planPickerLabel')}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
        {t('planPickerLabel')}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => {
          const isSelected = selected === card.id;
          return (
            <button
              key={card.id}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => onSelect(card.id)}
              className={`relative flex flex-col items-start rounded-2xl border px-3.5 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelected
                  ? 'border-accent-primary/70 bg-accent-primary/10 shadow-[0_0_24px_rgba(255,140,0,0.12)]'
                  : 'border-zinc-700/70 bg-zinc-950/40 hover:border-zinc-500'
              }`}
            >
              {card.badge ? (
                <span className="mb-2 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                  {card.badge}
                </span>
              ) : (
                <span className="mb-2 h-5" aria-hidden />
              )}
              <span className="text-lg font-bold text-zinc-50">{card.price}</span>
              <span className="mt-0.5 text-xs text-zinc-400">{card.period}</span>
              {card.hint ? (
                <span className="mt-2 text-[11px] leading-snug text-zinc-500">{card.hint}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default JoinArenaPlanPicker;
