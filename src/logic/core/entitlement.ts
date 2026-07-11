import type { UiGateJoinArenaFrom } from '../../types/uiGate';
import type { EntitlementState } from '../../types/entitlement';
import { MONETIZATION_CONFIG } from '../../config/monetization';

type Feature = 'core' | 'leaderboard-read' | 'leaderboard-write';

/** Auth session snapshot for UI gate decisions (mirrors auth store status). */
export type AuthStatus = 'loading' | 'signed-out' | 'signed-in';

export type GateFeature =
  | 'ladder-read'
  | 'ladder-upload'
  | 'cloud-sync'
  | 'dyno-intel-trial'
  | 'dyno-intel-full';

export type UiGateKind = 'none' | 'auth' | 'pro' | 'core';

export interface UiGateResult {
  kind: UiGateKind;
  joinArenaFrom?: UiGateJoinArenaFrom;
}

function safeDate(input: string | null): Date | null {
  if (!input) return null;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isGoogleLinkedAuth(authStatus: AuthStatus, isAnonymous: boolean): boolean {
  return authStatus === 'signed-in' && !isAnonymous;
}

function joinArenaFromForFeature(feature: GateFeature): UiGateJoinArenaFrom {
  if (feature === 'cloud-sync') return 'backup';
  if (feature === 'dyno-intel-trial' || feature === 'dyno-intel-full') return 'dyno-intel';
  return 'ladder';
}

function requiresProForFeature(
  feature: GateFeature,
  ent: EntitlementState,
  now: Date = new Date()
): boolean {
  if (feature === 'cloud-sync') {
    return !hasProAccess(ent, now);
  }
  // WHY: Commercial constitution — Dyno Intel (trial + full) is Pro-only with Google auth.
  if (feature === 'dyno-intel-full' || feature === 'dyno-intel-trial') {
    return !hasProAccess(ent, now);
  }
  if (!MONETIZATION_CONFIG.leaderboardPaywallEnabled) {
    return false;
  }
  return !hasCoreAccess(ent) || !hasProAccess(ent, now);
}

/**
 * Single source of truth for auth vs Pro UI gates across ladder, upload, cloud sync, and Dyno.
 *
 * Design intent (WHY): Beta ladder open-access and Pro-only cloud/Dyno previously diverged
 * in scattered checks — one decision tree keeps modal copy and navigation predictable.
 * Core is download-included (`owned`); `kind: 'core'` is unused by resolveUiGate
 * but retained on UiGateKind for upload-gate Exclude<> compatibility.
 * Route materialization stays in `uiGateNavigation` to keep logic/core framework-free.
 */
export function resolveUiGate(
  feature: GateFeature,
  ent: EntitlementState,
  authStatus: AuthStatus,
  isAnonymous: boolean,
  now: Date = new Date()
): UiGateResult {
  if (authStatus === 'loading') {
    return { kind: 'none' };
  }

  if (!isGoogleLinkedAuth(authStatus, isAnonymous)) {
    return { kind: 'auth' };
  }

  if (!requiresProForFeature(feature, ent, now)) {
    return { kind: 'none' };
  }

  return {
    kind: 'pro',
    joinArenaFrom: joinArenaFromForFeature(feature),
  };
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
export function shouldBlockStructuredUserSync(
  ent: EntitlementState,
  now: Date = new Date()
): boolean {
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

export function resolveLeaderboardAccessReason(
  uiGate: UiGateResult,
  ent: EntitlementState
): 'ok' | 'open-access' | 'auth-required' | 'pro-required' | 'pro-expired' {
  if (uiGate.kind === 'auth') return 'auth-required';
  if (uiGate.kind === 'pro') {
    return ent.subscriptionStatus === 'expired' ? 'pro-expired' : 'pro-required';
  }
  if (!MONETIZATION_CONFIG.leaderboardPaywallEnabled) return 'open-access';
  return 'ok';
}

