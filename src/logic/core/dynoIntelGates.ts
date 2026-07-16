import { isDynoIntelProBypassActive } from '../../config/dynoIntelAccess';
import type { EntitlementState } from '../../types/entitlement';
import type { UiGateJoinArenaFrom } from '../../types/uiGate';
import {
  type AuthStatus,
  hasCoreAccess,
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
  // WHY: Missing Core (or Pro) collapses to Pro paywall — Core is download-included for installers.
  return {
    allowed: false,
    blockReason: 'pro-required',
    joinArenaFrom: gate.joinArenaFrom ?? 'dyno-intel',
  };
}

/**
 * Maps DYNO INTEL diagnostic mode to auth / trial / Pro gates.
 * WHY: Core + Google unlocks trial (2/day) on single/cross-axis; weight-sim stays Pro-only.
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

  // WHY: Server assertDynoIntelModeAllowed — weight-simulation requires Pro; trial modes do not.
  const gateFeature = mode === 'weight-simulation' ? 'dyno-intel-full' : 'dyno-intel-trial';
  return mapUiGateToDynoAccess(resolveUiGate(gateFeature, ent, authStatus, isAnonymous, now));
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

/** Core + Google trial path (daily quota enforced server-side / client remaining). */
export function canUseDynoIntelTrial(
  ent: EntitlementState,
  authStatus: AuthStatus,
  isAnonymous: boolean,
  now: Date = new Date()
): boolean {
  if (!isGoogleLinkedAuth(authStatus, isAnonymous)) return false;
  if (isDynoIntelProBypassActive()) return true;
  void now;
  return hasCoreAccess(ent);
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
