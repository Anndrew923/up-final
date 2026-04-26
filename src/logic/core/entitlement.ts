import type { EntitlementState } from '../../types/entitlement';
import { MONETIZATION_CONFIG } from '../../config/monetization';

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
  if (!MONETIZATION_CONFIG.leaderboardPaywallEnabled) return true;
  return hasCoreAccess(ent) && hasProAccess(ent, now);
}

export function canUploadLeaderboard(ent: EntitlementState, now: Date = new Date()): boolean {
  if (!MONETIZATION_CONFIG.leaderboardPaywallEnabled) return true;
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

/** Pro-only structured user-data sync (independent of leaderboard beta paywall). */
export function shouldBlockStructuredUserSync(ent: EntitlementState, now: Date = new Date()): boolean {
  return !hasProAccess(ent, now);
}

export function getEntitlementReasonCode(
  ent: EntitlementState,
  feature: Feature,
  now: Date = new Date()
): 'ok' | 'open-access' | 'core-not-owned' | 'pro-required' | 'pro-expired' {
  if (feature !== 'core' && !MONETIZATION_CONFIG.leaderboardPaywallEnabled) return 'open-access';
  if (!hasCoreAccess(ent)) return 'core-not-owned';
  if (feature === 'core') return 'ok';
  if (hasProAccess(ent, now)) return 'ok';
  return ent.subscriptionStatus === 'expired' ? 'pro-expired' : 'pro-required';
}
