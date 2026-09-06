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
