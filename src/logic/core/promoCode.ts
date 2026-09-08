/**
 * Promo / invite code sanitization.
 * WHY: Client, Callable, and RevenueCat referrer tags must share one canonical form.
 */
export function normalizePromoCode(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().toUpperCase();
}

/**
 * Denormalized coach tag on `users/{uid}` (owner-readable).
 * WHY: `user_attributions` is Admin-only; native session bind must hydrate from the user doc.
 */
export function parseRedeemedReferrerCode(
  data: { referrer?: unknown; redeemedCode?: unknown } | null | undefined
): string | null {
  const fromReferrer = normalizePromoCode(data?.referrer);
  if (fromReferrer) return fromReferrer;
  const fromRedeemed = normalizePromoCode(data?.redeemedCode);
  return fromRedeemed || null;
}
