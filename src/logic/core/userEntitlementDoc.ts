import type { EntitlementState } from '../../types/entitlement';
import { hasProAccess } from './entitlement';

/** Raw Firestore user doc fields (camelCase + legacy snake_case). */
export type FirestoreUserEntitlementFields = {
  subscriptionStatus?: string | null;
  subscription_status?: string | null;
  proExpiresAt?: string | null;
  pro_expires_at?: string | null;
  proExpiresAtMs?: number | null;
  pro_expires_at_ms?: number | null;
  planId?: string | null;
  plan_id?: string | null;
  isPro?: boolean | null;
  is_pro?: boolean | null;
  purchaseStatus?: string | null;
  purchase_status?: string | null;
};

export type ParsedServerProEntitlement = {
  subscriptionStatus: 'pro' | 'grace';
  proExpiresAt: string;
  planId: string | null;
};

function resolveProExpiresAt(data: FirestoreUserEntitlementFields | undefined): string | null {
  const iso = data?.proExpiresAt ?? data?.pro_expires_at ?? undefined;
  if (typeof iso === 'string' && iso.trim()) return iso.trim();
  const ms = data?.proExpiresAtMs ?? data?.pro_expires_at_ms ?? undefined;
  if (typeof ms === 'number' && Number.isFinite(ms)) {
    return new Date(ms).toISOString();
  }
  return null;
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

/**
 * Parse `users/{uid}` entitlement fields into a commit payload when Pro is still valid.
 * WHY: Mirrors `functions/shared/userEntitlement.js` so client hydrate matches server gates.
 */
export function parseServerProFromUserDoc(
  data: FirestoreUserEntitlementFields | undefined,
  now: Date = new Date()
): ParsedServerProEntitlement | null {
  if (!data) return null;

  const subscriptionStatus = resolveSubscriptionStatus(data);
  if (subscriptionStatus !== 'pro' && subscriptionStatus !== 'grace') return null;

  const proExpiresAt = resolveProExpiresAt(data);
  if (!proExpiresAt) return null;

  const ent: EntitlementState = {
    purchaseStatus: 'owned',
    subscriptionStatus,
    isPro: false,
    proExpiresAt,
    planId: data.planId ?? data.plan_id ?? null,
    lastCheckedAt: null,
    proPurchaseCooldownUntil: null,
  };
  if (!hasProAccess(ent, now)) return null;

  return {
    subscriptionStatus,
    proExpiresAt,
    planId: ent.planId,
  };
}
