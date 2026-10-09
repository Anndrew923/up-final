export type PurchaseStatus = 'none' | 'owned';
export type SubscriptionStatus = 'free' | 'pro' | 'grace' | 'expired';

export interface EntitlementState {
  purchaseStatus: PurchaseStatus;
  subscriptionStatus: SubscriptionStatus;
  isPro: boolean;
  /** RevenueCat / store billing expiry (ISO). */
  proExpiresAt: string | null;
  /**
   * Invite / referral promo expiry (ISO). Independent gift calendar when unpaused.
   * WHY: Dual-read fallback for docs without `effectiveUntil`.
   */
  promoExpiresAt: string | null;
  /**
   * Stacked access end (store + frozen credit, or remaining gift).
   * WHY: Prefer this over max(store, promo) so overlapping gift days are not eaten.
   */
  effectiveUntil?: string | null;
  /** Frozen / remaining gift milliseconds. */
  promoCreditMs?: number | null;
  /** True while store billing is active and credit is not consuming. */
  promoPaused?: boolean;
  planId: string | null;
  lastCheckedAt: string | null;
  /**
   * ISO timestamp until which post-purchase Pro must not be reconcile-downgraded.
   * WHY: RC REST lag after a confirmed charge must not wipe a just-synced Firestore grant.
   */
  proPurchaseCooldownUntil: string | null;
  /**
   * Server-mirrored Genesis early-bird seat (`users/{uid}.isGenesisEarlyBird`).
   * WHY: Ladder lifetime free access for founding seats — independent of Pro billing.
   */
  isGenesisEarlyBird: boolean;
  /**
   * Seat ordinal 1–2000 when claimed via atomic counter; `null` for legacy grandfather.
   */
  genesisSeatNumber: number | null;
}
