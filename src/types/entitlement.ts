export type PurchaseStatus = 'none' | 'owned';
export type SubscriptionStatus = 'free' | 'pro' | 'grace' | 'expired';

export interface EntitlementState {
  purchaseStatus: PurchaseStatus;
  subscriptionStatus: SubscriptionStatus;
  isPro: boolean;
  proExpiresAt: string | null;
  planId: 'core_lifetime_099' | 'pro_monthly_099' | null;
  lastCheckedAt: string | null;
}
