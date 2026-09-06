import type { EntitlementState } from '../../types/entitlement';
import { hasProAccess } from './entitlement';
import { resolveEffectiveProExpiryIso } from './proExpiry';

/** Raw Firestore user doc fields (camelCase + legacy snake_case). */
export type FirestoreUserEntitlementFields = {
  subscriptionStatus?: string | null;
  subscription_status?: string | null;
  proExpiresAt?: string | null;
  pro_expires_at?: string | null;
  proExpiresAtMs?: number | null;
  pro_expires_at_ms?: number | null;
  promoExpiresAt?: string | null;
  promo_expires_at?: string | null;
  promoExpiresAtMs?: number | null;
  promo_expires_at_ms?: number | null;
  planId?: string | null;
  plan_id?: string | null;
  isPro?: boolean | null;
  is_pro?: boolean | null;
  purchaseStatus?: string | null;
  purchase_status?: string | null;
  /** Scheme A — mirrored from genesis seat claim / grandfather. */
  isGenesisEarlyBird?: boolean | null;
  is_genesis_early_bird?: boolean | null;
  genesisSeatNumber?: number | null;
  genesis_seat_number?: number | null;
};

export type ParsedServerProEntitlement = {
  subscriptionStatus: 'pro' | 'grace';
  /** Effective max(rc, promo) for client timers / hasProAccess. */
  proExpiresAt: string;
  /** RC billing mirror (may be null when promo-only). */
  rcExpiresAt: string | null;
  promoExpiresAt: string | null;
  planId: string | null;
};

/** Genesis seat mirror from `users/{uid}` — independent of Pro billing. */
export type ParsedGenesisEarlyBird = {
  isGenesisEarlyBird: boolean;
  genesisSeatNumber: number | null;
};

function resolveIsoOrMs(
  iso: string | null | undefined,
  ms: number | null | undefined
): string | null {
  if (typeof iso === 'string' && iso.trim()) return iso.trim();
  if (typeof ms === 'number' && Number.isFinite(ms)) {
    return new Date(ms).toISOString();
  }
  return null;
}

function resolveProExpiresAt(data: FirestoreUserEntitlementFields | undefined): string | null {
  return resolveIsoOrMs(
    data?.proExpiresAt ?? data?.pro_expires_at ?? undefined,
    data?.proExpiresAtMs ?? data?.pro_expires_at_ms ?? undefined
  );
}

function resolvePromoExpiresAt(data: FirestoreUserEntitlementFields | undefined): string | null {
  return resolveIsoOrMs(
    data?.promoExpiresAt ?? data?.promo_expires_at ?? undefined,
    data?.promoExpiresAtMs ?? data?.promo_expires_at_ms ?? undefined
  );
}

function resolveSubscriptionStatus(
  data: FirestoreUserEntitlementFields | undefined
): 'pro' | 'grace' | 'free' | 'expired' | null {
  const raw = data?.subscriptionStatus ?? data?.subscription_status ?? undefined;
  if (raw === 'pro' || raw === 'grace' || raw === 'free' || raw === 'expired') {
    return raw;
  }
  return null;
}

function resolveGenesisSeatNumber(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 1) {
    return Math.floor(raw);
  }
  return null;
}

/**
 * Parse Scheme A genesis mirror fields from `users/{uid}`.
 * WHY: Ladder lifetime free is independent of Pro — hydrate even when Pro parse returns null.
 */
export function parseGenesisEarlyBirdFromUserDoc(
  data: FirestoreUserEntitlementFields | undefined
): ParsedGenesisEarlyBird {
  if (!data) {
    return { isGenesisEarlyBird: false, genesisSeatNumber: null };
  }
  const flagged =
    data.isGenesisEarlyBird === true || data.is_genesis_early_bird === true;
  if (!flagged) {
    return { isGenesisEarlyBird: false, genesisSeatNumber: null };
  }
  return {
    isGenesisEarlyBird: true,
    genesisSeatNumber: resolveGenesisSeatNumber(
      data.genesisSeatNumber ?? data.genesis_seat_number
    ),
  };
}

/**
 * Parse `users/{uid}` entitlement fields into a commit payload when Pro is still valid.
 * WHY: Mirrors `functions/shared/userEntitlement.js` so client hydrate matches server gates.
 */
export function parseServerProFromUserDoc(
  data: FirestoreUserEntitlementFields | undefined,
  now: Date = new Date()
): ParsedServerProEntitlement | null {
  if (!data) return null;

  const rcRaw = resolveProExpiresAt(data);
  const promoExpiresAt = resolvePromoExpiresAt(data);
  // WHY: Expired RC must not stay as a live store-billing mirror (blocks convert + false already-pro).
  const rcExpiresAt =
    rcRaw && Date.parse(rcRaw) >= now.getTime() ? rcRaw : null;
  const effectiveIso = resolveEffectiveProExpiryIso({
    proExpiresAt: rcRaw,
    promoExpiresAt,
  });
  if (!effectiveIso) return null;

  let subscriptionStatus = resolveSubscriptionStatus(data);
  // Promo-only docs may briefly lack status; treat as pro when effective window is valid.
  if (subscriptionStatus !== 'pro' && subscriptionStatus !== 'grace') {
    if (!promoExpiresAt || Date.parse(promoExpiresAt) < now.getTime()) return null;
    subscriptionStatus = 'pro';
  }

  const ent: EntitlementState = {
    purchaseStatus: 'owned',
    subscriptionStatus,
    isPro: false,
    proExpiresAt: rcExpiresAt,
    promoExpiresAt,
    planId: data.planId ?? data.plan_id ?? null,
    lastCheckedAt: null,
    proPurchaseCooldownUntil: null,
    isGenesisEarlyBird: false,
    genesisSeatNumber: null,
  };
  if (!hasProAccess(ent, now)) return null;

  return {
    subscriptionStatus,
    proExpiresAt: effectiveIso,
    rcExpiresAt,
    promoExpiresAt,
    planId: ent.planId,
  };
}
