import { isDynoIntelProBypassActive } from '../../config/dynoIntelAccess';
import type { EntitlementState } from '../../types/entitlement';
import type { UiGateJoinArenaFrom } from '../../types/uiGate';
import {
  type AuthStatus,
  hasProAccess,
  isGoogleLinkedAuth,
  type UiGateResult,
  resolveUiGate,
} from './entitlement';
import type { DynoIntelMode } from './dynoIntelTypes';

function hasDynoIntelBypassAccess(authStatus: AuthStatus, isAnonymous: boolean): boolean {
  return isDynoIntelProBypassActive() && isGoogleLinkedAuth(authStatus, isAnonymous);
}

export type DynoIntelBlockReason = 'auth' | 'pro-required';

export interface DynoIntelAccessResult {
  allowed: boolean;
  blockReason?: DynoIntelBlockReason;
  joinArenaFrom?: UiGateJoinArenaFrom;
}

function mapUiGateToDynoAccess(gate: UiGateResult): DynoIntelAccessResult {
  if (gate.kind === 'none') return { allowed: true };
  if (gate.kind === 'auth') return { allowed: false, blockReason: 'auth' };
  // WHY: `core` is legacy-only (download-includes-Core); collapse into Pro paywall context.
  return {
    allowed: false,
    blockReason: 'pro-required',
    joinArenaFrom: gate.joinArenaFrom ?? 'dyno-intel',
  };
}

/**
 * Maps DYNO INTEL diagnostic mode to auth / Pro gates.
 * WHY: Commercial constitution — Dyno Intel is Pro-only; Core buyout is assumed for all installers.
 */
export function resolveDynoIntelAccess(
  mode: DynoIntelMode,
  ent: EntitlementState,
  authStatus: AuthStatus,
  isAnonymous: boolean,
  now: Date = new Date()
): DynoIntelAccessResult {
  if (authStatus === 'loading') {
    return { allowed: false };
  }

  if (hasDynoIntelBypassAccess(authStatus, isAnonymous)) {
    return { allowed: true };
  }

  // WHY: Mode no longer splits trial vs full — all inference paths share the Pro gate.
  void mode;
  return mapUiGateToDynoAccess(
    resolveUiGate('dyno-intel-full', ent, authStatus, isAnonymous, now)
  );
}

/**
 * Resolves sheet entry mode from route suggestion.
 * WHY: Inference mode is fixed; access gate alone decides open vs paywall.
 */
export function resolveDynoIntelSheetEntry(
  suggestedMode: DynoIntelMode,
  ent: EntitlementState,
  authStatus: AuthStatus,
  isAnonymous: boolean,
  now: Date = new Date()
): { openMode: DynoIntelMode; access: DynoIntelAccessResult } {
  const access = resolveDynoIntelAccess(suggestedMode, ent, authStatus, isAnonymous, now);
  return { openMode: suggestedMode, access };
}

/** @deprecated Prefer `canUseDynoIntelFull` — trial is no longer a separate entitlement tier. */
export function canUseDynoIntelTrial(
  ent: EntitlementState,
  authStatus: AuthStatus,
  isAnonymous: boolean,
  now: Date = new Date()
): boolean {
  return canUseDynoIntelFull(ent, authStatus, isAnonymous, now);
}

export function canUseDynoIntelFull(
  ent: EntitlementState,
  authStatus: AuthStatus,
  isAnonymous: boolean,
  now: Date = new Date()
): boolean {
  if (!isGoogleLinkedAuth(authStatus, isAnonymous)) return false;
  if (isDynoIntelProBypassActive()) return true;
  return hasProAccess(ent, now);
}

export function canUseDynoIntelMode(
  mode: DynoIntelMode,
  ent: EntitlementState,
  authStatus: AuthStatus,
  isAnonymous: boolean,
  now: Date = new Date()
): boolean {
  return resolveDynoIntelAccess(mode, ent, authStatus, isAnonymous, now).allowed;
}
