/**
 * Dual-track Pro expiry with credit-based linear stacking.
 *
 * WHY: `max(store, promo)` eats overlapping gift days when a user converts during a
 * promo window. Remaining gift time is a pausable credit (`promoCreditMs`): freeze
 * while store billing is active; consume from `now` when the store lapses.
 *
 * Dual-read: prefer persisted `effectiveUntil`; else stack from credit fields;
 * else legacy `max(store, promo)` for docs that have not been backfilled.
 */

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function safeDate(input) {
  if (!input) return null;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toNowMs(now) {
  if (now instanceof Date) return now.getTime();
  if (typeof now === "number" && Number.isFinite(now)) return now;
  return Date.now();
}

function finiteMs(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

function resolveIsoOrMs(iso, ms) {
  if (typeof iso === "string" && iso.trim()) {
    const fromIso = safeDate(iso.trim());
    if (fromIso) return fromIso.getTime();
  }
  if (typeof ms === "number" && Number.isFinite(ms)) return ms;
  return null;
}

function toIso(ms) {
  if (ms == null || !Number.isFinite(ms)) return null;
  return new Date(ms).toISOString();
}

function pick(data, camel, snake) {
  if (!data) return undefined;
  if (data[camel] !== undefined && data[camel] !== null) return data[camel];
  return data[snake];
}

function resolveStoreMs(data) {
  return resolveIsoOrMs(
    pick(data, "proExpiresAt", "pro_expires_at"),
    pick(data, "proExpiresAtMs", "pro_expires_at_ms")
  );
}

function resolvePromoMs(data) {
  return resolveIsoOrMs(
    pick(data, "promoExpiresAt", "promo_expires_at"),
    pick(data, "promoExpiresAtMs", "promo_expires_at_ms")
  );
}

function resolveCachedEffectiveMs(data) {
  return resolveIsoOrMs(
    pick(data, "effectiveUntil", "effective_until"),
    pick(data, "effectiveUntilMs", "effective_until_ms")
  );
}

function hasCreditFields(data) {
  return (
    finiteMs(pick(data, "promoCreditMs", "promo_credit_ms")) != null ||
    pick(data, "promoPaused", "promo_paused") === true ||
    finiteMs(pick(data, "promoCreditAsOfMs", "promo_credit_as_of_ms")) != null
  );
}

function buildSnapshot({ storeMs, remainingMs, paused, nowMs }) {
  const remaining = Math.max(0, Math.floor(remainingMs));
  const storeActive = storeMs != null && storeMs > nowMs;
  const effectiveMs = storeActive
    ? storeMs + remaining
    : remaining > 0
      ? nowMs + remaining
      : null;
  const promoMs = remaining > 0 ? nowMs + remaining : null;
  return {
    proExpiresAt: toIso(storeMs),
    proExpiresAtMs: storeMs,
    promoExpiresAt: toIso(promoMs),
    promoExpiresAtMs: promoMs,
    promoCreditMs: remaining,
    promoPaused: Boolean(paused && remaining > 0 && storeActive),
    promoCreditAsOfMs: remaining > 0 ? nowMs : null,
    effectiveUntil: toIso(effectiveMs),
    effectiveUntilMs: effectiveMs,
  };
}

/** Firestore user-doc fields written from a stacking snapshot. */
export function stackingFieldsFromSnapshot(snap) {
  return {
    proExpiresAt: snap.proExpiresAt,
    proExpiresAtMs: snap.proExpiresAtMs,
    promoExpiresAt: snap.promoExpiresAt,
    promoExpiresAtMs: snap.promoExpiresAtMs,
    promoCreditMs: snap.promoCreditMs,
    promoPaused: snap.promoPaused === true,
    promoCreditAsOfMs: snap.promoCreditAsOfMs,
    effectiveUntil: snap.effectiveUntil,
    effectiveUntilMs: snap.effectiveUntilMs,
  };
}

/**
 * Unconsumed gift milliseconds at `now`.
 * WHY: While store billing is active the clock is frozen (`promoCreditMs`).
 * After the store lapses, remaining is `effectiveUntil - now` so paused wall-clock
 * is not subtracted twice.
 */
export function remainingPromoCreditMs(data, now) {
  const nowMs = toNowMs(now);
  const storeMs = resolveStoreMs(data);
  const storeActive = storeMs != null && storeMs > nowMs;
  const storedCredit = finiteMs(pick(data, "promoCreditMs", "promo_credit_ms"));
  const cached = resolveCachedEffectiveMs(data);

  if (storeActive) {
    if (storedCredit != null) return Math.max(0, storedCredit);
    if (cached != null && storeMs != null) return Math.max(0, cached - storeMs);
    const promoMs = resolvePromoMs(data);
    return promoMs != null ? Math.max(0, promoMs - nowMs) : 0;
  }

  if (cached != null) return Math.max(0, cached - nowMs);

  if (storedCredit != null) {
    const asOf = finiteMs(pick(data, "promoCreditAsOfMs", "promo_credit_as_of_ms")) ?? nowMs;
    return Math.max(0, storedCredit - Math.max(0, nowMs - asOf));
  }

  const promoMs = resolvePromoMs(data);
  return promoMs != null ? Math.max(0, promoMs - nowMs) : 0;
}

export function computeStackedEffectiveUntilMs(data, now) {
  const nowMs = toNowMs(now);
  const storeMs = resolveStoreMs(data);
  const storeActive = storeMs != null && storeMs > nowMs;
  const remaining = remainingPromoCreditMs(data, nowMs);
  if (storeActive && storeMs != null) return storeMs + remaining;
  if (remaining > 0) return nowMs + remaining;
  return null;
}

function resolveLegacyMaxMs(data) {
  const rcMs = resolveStoreMs(data) ?? Number.NEGATIVE_INFINITY;
  const promoMs = resolvePromoMs(data) ?? Number.NEGATIVE_INFINITY;
  const maxMs = Math.max(rcMs, promoMs);
  return Number.isFinite(maxMs) && maxMs > Number.NEGATIVE_INFINITY ? maxMs : null;
}

/** Milliseconds of stacked (or legacy max) access end, or null when neither track exists. */
export function resolveEffectiveProExpiryMs(data, now) {
  const nowMs = toNowMs(now);
  const cached = resolveCachedEffectiveMs(data);
  if (cached != null) return cached;
  if (hasCreditFields(data)) {
    return computeStackedEffectiveUntilMs(data, nowMs);
  }
  return resolveLegacyMaxMs(data);
}

export function resolveEffectiveProExpiryIso(data, now) {
  const ms = resolveEffectiveProExpiryMs(data, now);
  return ms == null ? null : new Date(ms).toISOString();
}

export function isPromoExpiryActive(data, now = new Date()) {
  if (hasCreditFields(data)) {
    return remainingPromoCreditMs(data, now) > 0;
  }
  const promoMs = resolveIsoOrMs(
    pick(data, "promoExpiresAt", "promo_expires_at"),
    pick(data, "promoExpiresAtMs", "promo_expires_at_ms")
  );
  return promoMs != null && promoMs >= toNowMs(now);
}

export function resolvePromoExpiresAtIso(data) {
  const iso = pick(data, "promoExpiresAt", "promo_expires_at");
  if (typeof iso === "string" && iso.trim()) return iso.trim();
  const ms = pick(data, "promoExpiresAtMs", "promo_expires_at_ms");
  if (typeof ms === "number" && Number.isFinite(ms)) {
    return new Date(ms).toISOString();
  }
  return null;
}

/** Redeem / extra grant: add `grantMs` onto remaining credit, then restack. */
export function applyPromoGrant(current, grantMs, now) {
  const nowMs = toNowMs(now);
  const grant = Math.max(0, Math.floor(grantMs));
  const remaining = remainingPromoCreditMs(current, nowMs) + grant;
  const storeMs = resolveStoreMs(current);
  const storeActive = storeMs != null && storeMs > nowMs;
  return buildSnapshot({
    storeMs,
    remainingMs: remaining,
    paused: storeActive,
    nowMs,
  });
}

/**
 * INITIAL_PURCHASE / RENEWAL: freeze remaining credit; do not add another grant.
 * `effectiveUntil = storeExpiresAt + frozenCredit`.
 */
export function applyStoreEntitlement(current, storeExpiresAtMs, now) {
  const nowMs = toNowMs(now);
  const remaining = remainingPromoCreditMs(current, nowMs);
  const storeMs = Number.isFinite(storeExpiresAtMs) ? storeExpiresAtMs : null;
  const storeActive = storeMs != null && storeMs > nowMs;
  return buildSnapshot({
    storeMs,
    remainingMs: remaining,
    paused: storeActive && remaining > 0,
    nowMs,
  });
}

/**
 * Store lapse / refund: unpause. Remaining credit starts consuming from `now`.
 */
export function applyStoreCleared(current, now) {
  const nowMs = toNowMs(now);
  const remaining = remainingPromoCreditMs(current, nowMs);
  return buildSnapshot({
    storeMs: null,
    remainingMs: remaining,
    paused: false,
    nowMs,
  });
}
