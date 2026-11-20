/**
 * Display / package identifiers for Pro subscription dual-track.
 * WHY: Store prices live in ASC/Play; these are marketing defaults for Paywall copy.
 */
export const PRO_SUBSCRIPTION_PLANS = {
  monthly: {
    packageId: '$rc_monthly',
    priceUsd: 1.99,
    periodLabelKey: 'planMonthlyPeriod',
  },
  annual: {
    packageId: '$rc_annual',
    priceUsd: 14.99,
    /** 14.99 / 12 ≈ 1.25 */
    monthlyEquivalentUsd: 1.25,
    savingsPercent: 37,
    periodLabelKey: 'planAnnualPeriod',
  },
} as const;

export type ProSubscriptionPlanId = keyof typeof PRO_SUBSCRIPTION_PLANS;

export const DEFAULT_PRO_SUBSCRIPTION_PLAN: ProSubscriptionPlanId = 'annual';

/**
 * i18n interpolation bag for Dyno / marketing paywalls when store `priceString` is absent.
 * WHY: One formatter so UI cannot re-hardcode stale $1.00 / NT$30 while SKUs stay unchanged.
 */
export function resolveProPaywallPriceVars(): {
  readonly monthly: string;
  readonly annual: string;
} {
  return {
    monthly: PRO_SUBSCRIPTION_PLANS.monthly.priceUsd.toFixed(2),
    annual: PRO_SUBSCRIPTION_PLANS.annual.priceUsd.toFixed(2),
  };
}
