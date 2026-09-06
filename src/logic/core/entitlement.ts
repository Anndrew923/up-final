import type { UiGateJoinArenaFrom } from '../../types/uiGate';
import type { EntitlementState } from '../../types/entitlement';
import { MONETIZATION_CONFIG } from '../../config/monetization';
import {
  isPromoExpiryActive,
  resolveEffectiveProExpiryMs,
} from './proExpiry';

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

/** Post-purchase shield against stale RC reconcile wiping a hard-synced Firestore Pro grant. */
export const PRO_PURCHASE_COOLDOWN_MS = 5 * 60 * 1000;

function safeDate(input: string | null): Date | null {
  if (!input) return null;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** True while a successful hard-sync purchase cooldown is still in effect. */
export function isProPurchaseCooldownActive(
  ent: Pick<EntitlementState, 'proPurchaseCooldownUntil'>,
  now: Date = new Date()
): boolean {
  const until = safeDate(ent.proPurchaseCooldownUntil ?? null);
  if (!until) return false;
  return until.getTime() > now.getTime();
}

/**
 * WHY: Optimistic Pro unlock without a future expiry creates fake `isPro` that
 * `normalizeProExpiry` immediately folds to `expired` — block that path at the gate.
 */
export function isValidActiveProExpiry(
  expiresDate: string | null | undefined,
  now: Date = new Date()
): boolean {
  const expiresAt = safeDate(expiresDate ?? null);
  if (!expiresAt) return false;
  return expiresAt.getTime() >= now.getTime();
}

/**
 * WHY: During purchase cooldown, inactive/stale RC snapshots must not clear local Pro
 * or trigger reconcile revocation against the Firestore SSOT just written.
 */
export function shouldBlockProReconcileDowngrade(
  ent: Pick<EntitlementState, 'proPurchaseCooldownUntil'>,
  snapshotActive: boolean,
  now: Date = new Date()
): boolean {
  return !snapshotActive && isProPurchaseCooldownActive(ent, now);
}

/**
 * WHY: Play/Android purchases do not surface as active on iOS StoreKit RC reads.
 * When Firestore or a prior hydrate already granted valid Pro, an inactive local-store
 * snapshot must not downgrade UI or trigger server reconcile revocation.
 * Also blocks wipe while coach promo window is still active.
 */
export function shouldBlockCrossPlatformProDowngrade(
  ent: EntitlementState,
  snapshotActive: boolean,
  now: Date = new Date()
): boolean {
  if (snapshotActive) return false;
  if (shouldBlockProReconcileDowngrade(ent, snapshotActive, now)) return true;
  if (isPromoExpiryActive(ent.promoExpiresAt, now)) return true;
  return hasProAccess(ent, now);
}

export function isGoogleLinkedAuth(authStatus: AuthStatus, isAnonymous: boolean): boolean {
  return authStatus === 'signed-in' && !isAnonymous;
}

function joinArenaFromForFeature(feature: GateFeature): UiGateJoinArenaFrom {
  if (feature === 'cloud-sync') return 'backup';
  if (feature === 'dyno-intel-trial' || feature === 'dyno-intel-full') return 'dyno-intel';
  return 'ladder';
}

function requiresCoreForFeature(feature: GateFeature, ent: EntitlementState): boolean {
  // WHY: Free Dyno trial (2/day) is Core + Google — not Pro. Missing Core still blocks inference.
  return feature === 'dyno-intel-trial' && !hasCoreAccess(ent);
}

function requiresProForFeature(
  feature: GateFeature,
  ent: EntitlementState,
  now: Date = new Date()
): boolean {
  // WHY: High-cost surfaces stay Pro forever — Genesis seats never unlock Dyno / cloud sync.
  if (feature === 'cloud-sync' || feature === 'dyno-intel-full') {
    return !hasProAccess(ent, now);
  }

  // WHY: Founding seats get lifetime ladder access; non-pioneers follow the global paywall flag.
  if (feature === 'ladder-read' || feature === 'ladder-upload') {
    if (ent.isGenesisEarlyBird) return false;
    if (!MONETIZATION_CONFIG.leaderboardPaywallEnabled) return false;
    return !hasCoreAccess(ent) || !hasProAccess(ent, now);
  }

  return false;
}

/**
 * Single source of truth for auth vs Pro UI gates across ladder, upload, cloud sync, and Dyno.
 *
 * Design intent (WHY): Trial Dyno (Core + Google, 2/day) and Pro-only full Dyno / cloud
 * must diverge in one tree so paywall copy stays predictable. `kind: 'core'` surfaces
 * missing Core for trial; ladder still collapses Core into Pro when paywall is on.
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

  if (requiresCoreForFeature(feature, ent)) {
    return {
      kind: 'core',
      joinArenaFrom: joinArenaFromForFeature(feature),
    };
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

/**
 * Effective Pro = now < max(rcExpiresAt, promoExpiresAt).
 * Status pro/grace is preferred; active promo alone is accepted as defense in depth.
 */
export function hasProAccess(ent: EntitlementState, now: Date = new Date()): boolean {
  const effectiveMs = resolveEffectiveProExpiryMs(ent);
  if (effectiveMs == null || effectiveMs < now.getTime()) return false;

  if (ent.subscriptionStatus === 'pro' || ent.subscriptionStatus === 'grace') return true;
  return isPromoExpiryActive(ent.promoExpiresAt, now);
}

export function canAccessLeaderboard(ent: EntitlementState, now: Date = new Date()): boolean {
  if (ent.isGenesisEarlyBird) return hasCoreAccess(ent);
  if (!MONETIZATION_CONFIG.leaderboardPaywallEnabled) return true;
  return hasCoreAccess(ent) && hasProAccess(ent, now);
}

export function canUploadLeaderboard(ent: EntitlementState, now: Date = new Date()): boolean {
  if (ent.isGenesisEarlyBird) return hasCoreAccess(ent);
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
  // WHY: Founding seats keep ladder reason = ok after cutover (matches canAccessLeaderboard).
  if (
    (feature === 'leaderboard-read' || feature === 'leaderboard-write') &&
    ent.isGenesisEarlyBird
  ) {
    return 'ok';
  }
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
