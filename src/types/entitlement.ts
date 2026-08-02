export type PurchaseStatus = 'none' | 'owned';
export type SubscriptionStatus = 'free' | 'pro' | 'grace' | 'expired';

export interface EntitlementState {
  purchaseStatus: PurchaseStatus;
  subscriptionStatus: SubscriptionStatus;
  isPro: boolean;
  proExpiresAt: string | null;
  planId: string | null;
  lastCheckedAt: string | null;
  /**
   * ISO timestamp until which post-purchase Pro must not be reconcile-downgraded.
   * WHY: RC REST lag after a confirmed charge must not wipe a just-synced Firestore grant.
   */
  proPurchaseCooldownUntil: string | null;
}
