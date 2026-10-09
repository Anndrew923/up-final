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

function safeDate(input: string | null | undefined): Date | null {
  if (!input) return null;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toNowMs(now?: Date | number): number {
  if (now instanceof Date) return now.getTime();
  if (typeof now === 'number' && Number.isFinite(now)) return now;
  return Date.now();
}

function finiteMs(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value;
}

function resolveIsoOrMs(
  iso: string | null | undefined,
  ms: number | null | undefined
): number | null {
  if (typeof iso === 'string' && iso.trim()) {
    const fromIso = safeDate(iso.trim());
    if (fromIso) return fromIso.getTime();
  }
  return finiteMs(ms ?? null);
}

function toIso(ms: number | null): string | null {
  if (ms == null || !Number.isFinite(ms)) return null;
  return new Date(ms).toISOString();
}

export type ProExpirySources = {
  proExpiresAt?: string | null;
  promoExpiresAt?: string | null;
  effectiveUntil?: string | null;
  effectiveUntilMs?: number | null;
  promoCreditMs?: number | null;
  promoPaused?: boolean | null;
  promoCreditAsOfMs?: number | null;
  proExpiresAtMs?: number | null;
  promoExpiresAtMs?: number | null;
};

export type ProExpirySnapshot = {
  proExpiresAt: string | null;
  proExpiresAtMs: number | null;
  promoExpiresAt: string | null;
  promoExpiresAtMs: number | null;
  promoCreditMs: number;
  promoPaused: boolean;
  promoCreditAsOfMs: number | null;
  effectiveUntil: string | null;
  effectiveUntilMs: number | null;
};

function resolveStoreMs(sources: ProExpirySources): number | null {
  return resolveIsoOrMs(sources.proExpiresAt ?? null, sources.proExpiresAtMs ?? null);
}

function resolvePromoMs(sources: ProExpirySources): number | null {
  return resolveIsoOrMs(sources.promoExpiresAt ?? null, sources.promoExpiresAtMs ?? null);
}

function resolveCachedEffectiveMs(sources: ProExpirySources): number | null {
  return resolveIsoOrMs(sources.effectiveUntil ?? null, sources.effectiveUntilMs ?? null);
}

function hasCreditFields(sources: ProExpirySources): boolean {
  return (
    finiteMs(sources.promoCreditMs ?? null) != null ||
    sources.promoPaused === true ||
    finiteMs(sources.promoCreditAsOfMs ?? null) != null
  );
}

function buildSnapshot(input: {
  storeMs: number | null;
  remainingMs: number;
  paused: boolean;
  nowMs: number;
}): ProExpirySnapshot {
  const remainingMs = Math.max(0, Math.floor(input.remainingMs));
  const storeMs = input.storeMs;
  const storeActive = storeMs != null && storeMs > input.nowMs;
  const effectiveMs = storeActive
    ? storeMs + remainingMs
    : remainingMs > 0
      ? input.nowMs + remainingMs
      : null;
  const promoMs = remainingMs > 0 ? input.nowMs + remainingMs : null;
  return {
    proExpiresAt: toIso(storeMs),
    proExpiresAtMs: storeMs,
    promoExpiresAt: toIso(promoMs),
    promoExpiresAtMs: promoMs,
    promoCreditMs: remainingMs,
    promoPaused: Boolean(input.paused && remainingMs > 0 && storeActive),
    promoCreditAsOfMs: remainingMs > 0 ? input.nowMs : null,
    effectiveUntil: toIso(effectiveMs),
    effectiveUntilMs: effectiveMs,
  };
}

/** Firestore user-doc fields written from a stacking snapshot. */
export function stackingFieldsFromSnapshot(snap: ProExpirySnapshot): ProExpirySnapshot {
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
export function remainingPromoCreditMs(
  sources: ProExpirySources,
  now?: Date | number
): number {
  const nowMs = toNowMs(now);
  const storeMs = resolveStoreMs(sources);
  const storeActive = storeMs != null && storeMs > nowMs;
  const storedCredit = finiteMs(sources.promoCreditMs ?? null);
  const cached = resolveCachedEffectiveMs(sources);

  if (storeActive) {
    if (storedCredit != null) return Math.max(0, storedCredit);
    if (cached != null && storeMs != null) return Math.max(0, cached - storeMs);
    const promoMs = resolvePromoMs(sources);
    return promoMs != null ? Math.max(0, promoMs - nowMs) : 0;
  }

  if (cached != null) return Math.max(0, cached - nowMs);

  if (storedCredit != null) {
    const asOf = finiteMs(sources.promoCreditAsOfMs ?? null) ?? nowMs;
    return Math.max(0, storedCredit - Math.max(0, nowMs - asOf));
  }

  const promoMs = resolvePromoMs(sources);
  return promoMs != null ? Math.max(0, promoMs - nowMs) : 0;
}

/**
 * Stacked access end: store + frozen credit when billing is live; otherwise now + remaining.
 */
export function computeStackedEffectiveUntilMs(
  sources: ProExpirySources,
  now?: Date | number
): number | null {
  const nowMs = toNowMs(now);
  const storeMs = resolveStoreMs(sources);
  const storeActive = storeMs != null && storeMs > nowMs;
  const remaining = remainingPromoCreditMs(sources, nowMs);
  if (storeActive && storeMs != null) return storeMs + remaining;
  if (remaining > 0) return nowMs + remaining;
  return null;
}

function resolveLegacyMaxMs(sources: ProExpirySources): number | null {
  const rcMs = resolveStoreMs(sources) ?? Number.NEGATIVE_INFINITY;
  const promoMs = resolvePromoMs(sources) ?? Number.NEGATIVE_INFINITY;
  const maxMs = Math.max(rcMs, promoMs);
  return Number.isFinite(maxMs) && maxMs > Number.NEGATIVE_INFINITY ? maxMs : null;
}

/** Milliseconds of stacked (or legacy max) access end, or null when neither track exists. */
export function resolveEffectiveProExpiryMs(
  sources: ProExpirySources,
  now?: Date | number
): number | null {
  const nowMs = toNowMs(now);
  const cached = resolveCachedEffectiveMs(sources);
  if (cached != null) return cached;
  if (hasCreditFields(sources)) {
    return computeStackedEffectiveUntilMs(sources, nowMs);
  }
  return resolveLegacyMaxMs(sources);
}

/** ISO of effective expiry, or null. */
export function resolveEffectiveProExpiryIso(
  sources: ProExpirySources,
  now?: Date | number
): string | null {
  const ms = resolveEffectiveProExpiryMs(sources, now);
  return ms == null ? null : new Date(ms).toISOString();
}

/**
 * Gift still unused: credit fields when present, else legacy promo calendar.
 * Accepts a raw ISO string (legacy callers) or a full expiry snapshot.
 */
export function isPromoExpiryActive(
  input: string | null | undefined | ProExpirySources,
  now: Date = new Date()
): boolean {
  if (input && typeof input === 'object') {
    if (hasCreditFields(input)) {
      return remainingPromoCreditMs(input, now) > 0;
    }
    const promo = safeDate(input.promoExpiresAt ?? null);
    return Boolean(promo && promo.getTime() >= now.getTime());
  }
  const promo = safeDate(input ?? null);
  return Boolean(promo && promo.getTime() >= now.getTime());
}

/** Redeem / extra grant: add `grantMs` onto remaining credit, then restack. */
export function applyPromoGrant(
  current: ProExpirySources,
  grantMs: number,
  now?: Date | number
): ProExpirySnapshot {
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
export function applyStoreEntitlement(
  current: ProExpirySources,
  storeExpiresAtMs: number,
  now?: Date | number
): ProExpirySnapshot {
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
export function applyStoreCleared(
  current: ProExpirySources,
  now?: Date | number
): ProExpirySnapshot {
  const nowMs = toNowMs(now);
  const remaining = remainingPromoCreditMs(current, nowMs);
  return buildSnapshot({
    storeMs: null,
    remainingMs: remaining,
    paused: false,
    nowMs,
  });
}
