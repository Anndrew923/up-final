/**
 * Dual-track Pro expiry: RC billing (`proExpiresAt`) + coach promo (`promoExpiresAt`).
 * WHY: RC reconcile must never wipe an active promo window; effective access is max().
 */

function safeDate(input: string | null | undefined): Date | null {
  if (!input) return null;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export type ProExpirySources = {
  proExpiresAt?: string | null;
  promoExpiresAt?: string | null;
};

/** Milliseconds of max(rc, promo), or null when neither is a valid date. */
export function resolveEffectiveProExpiryMs(sources: ProExpirySources): number | null {
  const rcMs = safeDate(sources.proExpiresAt ?? null)?.getTime() ?? Number.NEGATIVE_INFINITY;
  const promoMs = safeDate(sources.promoExpiresAt ?? null)?.getTime() ?? Number.NEGATIVE_INFINITY;
  const maxMs = Math.max(rcMs, promoMs);
  return Number.isFinite(maxMs) && maxMs > Number.NEGATIVE_INFINITY ? maxMs : null;
}

/** ISO of effective expiry, or null. */
export function resolveEffectiveProExpiryIso(sources: ProExpirySources): string | null {
  const ms = resolveEffectiveProExpiryMs(sources);
  return ms == null ? null : new Date(ms).toISOString();
}

export function isPromoExpiryActive(
  promoExpiresAt: string | null | undefined,
  now: Date = new Date()
): boolean {
  const promo = safeDate(promoExpiresAt ?? null);
  return Boolean(promo && promo.getTime() >= now.getTime());
}
