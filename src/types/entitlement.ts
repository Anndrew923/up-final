export type PurchaseStatus = 'none' | 'owned';
export type SubscriptionStatus = 'free' | 'pro' | 'grace' | 'expired';

export interface EntitlementState {
  purchaseStatus: PurchaseStatus;
  subscriptionStatus: SubscriptionStatus;
  isPro: boolean;
  proExpiresAt: string | null;
  planId: string | null;
  lastCheckedAt: string | null;
}
