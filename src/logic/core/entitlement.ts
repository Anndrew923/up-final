import type { EntitlementState } from '../../types/entitlement';

type Feature = 'core' | 'leaderboard-read' | 'leaderboard-write';

function safeDate(input: string | null): Date | null {
  if (!input) return null;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function hasCoreAccess(ent: EntitlementState): boolean {
  return ent.purchaseStatus === 'owned';
}

export function hasProAccess(ent: EntitlementState, now: Date = new Date()): boolean {
  if (ent.subscriptionStatus === 'pro') return true;
  if (ent.subscriptionStatus !== 'grace') return false;

  const expiresAt = safeDate(ent.proExpiresAt);
  if (!expiresAt) return false;
  return expiresAt.getTime() >= now.getTime();
}

export function canAccessLeaderboard(ent: EntitlementState, now: Date = new Date()): boolean {
  return hasCoreAccess(ent) && hasProAccess(ent, now);
}

export function canUploadLeaderboard(ent: EntitlementState, now: Date = new Date()): boolean {
  return hasCoreAccess(ent) && hasProAccess(ent, now);
}

export function shouldBlockFirebase(
  ent: EntitlementState,
  feature: 'leaderboard-read' | 'leaderboard-write'
): boolean {
  if (feature === 'leaderboard-read') {
    return !canAccessLeaderboard(ent);
  }
  return !canUploadLeaderboard(ent);
}

export function getEntitlementReasonCode(
  ent: EntitlementState,
  feature: Feature,
  now: Date = new Date()
): 'ok' | 'core-not-owned' | 'pro-required' | 'pro-expired' {
  if (!hasCoreAccess(ent)) return 'core-not-owned';
  if (feature === 'core') return 'ok';
  if (hasProAccess(ent, now)) return 'ok';
  return ent.subscriptionStatus === 'expired' ? 'pro-expired' : 'pro-required';
}
