/**
 * Dual-track Pro expiry: RC billing (`proExpiresAt`) + coach promo (`promoExpiresAt`).
 * WHY: RC reconcile must never wipe an active promo window; effective access is max().
 */

export function safeDate(input) {
  if (!input) return null;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveIsoOrMs(iso, ms) {
  if (typeof iso === "string" && iso.trim()) {
    const fromIso = safeDate(iso.trim());
    if (fromIso) return fromIso.getTime();
  }
  if (typeof ms === "number" && Number.isFinite(ms)) return ms;
  return Number.NEGATIVE_INFINITY;
}

/** Milliseconds of max(rc, promo), or null when neither is a valid date. */
export function resolveEffectiveProExpiryMs(data) {
  const rcMs = resolveIsoOrMs(
    data?.proExpiresAt ?? data?.pro_expires_at,
    data?.proExpiresAtMs ?? data?.pro_expires_at_ms
  );
  const promoMs = resolveIsoOrMs(
    data?.promoExpiresAt ?? data?.promo_expires_at,
    data?.promoExpiresAtMs ?? data?.promo_expires_at_ms
  );
  const maxMs = Math.max(rcMs, promoMs);
  return Number.isFinite(maxMs) && maxMs > Number.NEGATIVE_INFINITY ? maxMs : null;
}

export function resolveEffectiveProExpiryIso(data) {
  const ms = resolveEffectiveProExpiryMs(data);
  return ms == null ? null : new Date(ms).toISOString();
}

export function isPromoExpiryActive(data, now = new Date()) {
  const promoMs = resolveIsoOrMs(
    data?.promoExpiresAt ?? data?.promo_expires_at,
    data?.promoExpiresAtMs ?? data?.promo_expires_at_ms
  );
  return Number.isFinite(promoMs) && promoMs >= now.getTime();
}

export function resolvePromoExpiresAtIso(data) {
  const iso = data?.promoExpiresAt ?? data?.promo_expires_at;
  if (typeof iso === "string" && iso.trim()) return iso.trim();
  const ms = data?.promoExpiresAtMs ?? data?.promo_expires_at_ms;
  if (typeof ms === "number" && Number.isFinite(ms)) {
    return new Date(ms).toISOString();
  }
  return null;
}
