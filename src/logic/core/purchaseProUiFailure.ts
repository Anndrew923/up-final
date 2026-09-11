/**
 * Map service-layer purchase failure reasons to JoinArena / paywall UI buckets.
 * WHY: Keep store/SDK reason strings out of presentational components.
 */

/** Shared failure taxonomy — subscriptionService + UI mappers stay in sync. */
export type PurchaseProFailureReason =
  | 'core-required'
  | 'already-pro'
  | 'auth-required'
  | 'billing-unavailable'
  | 'no-offerings'
  | 'no-receipt'
  | 'invalid-expiry'
  | 'sync-failed'
  | 'failed';

export type PurchaseProUiFailureReason =
  | 'billing'
  | 'auth'
  | 'core'
  | 'no-receipt'
  | 'invalid-expiry'
  | 'sync-failed'
  | 'no-offerings';

export function mapPurchaseProFailureToUi(
  reason: PurchaseProFailureReason
): PurchaseProUiFailureReason {
  switch (reason) {
    case 'auth-required':
      return 'auth';
    case 'core-required':
      return 'core';
    case 'no-receipt':
      return 'no-receipt';
    case 'invalid-expiry':
      return 'invalid-expiry';
    case 'sync-failed':
      return 'sync-failed';
    case 'no-offerings':
      return 'no-offerings';
    default:
      return 'billing';
  }
}
