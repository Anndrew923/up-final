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

export type DynoIntelBlockReason = 'auth' | 'core-required' | 'pro-required';

export interface DynoIntelAccessResult {
  allowed: boolean;
  blockReason?: DynoIntelBlockReason;
  joinArenaFrom?: UiGateJoinArenaFrom;
}

function gateFeatureForMode(mode: DynoIntelMode): 'dyno-intel-trial' | 'dyno-intel-full' {
  if (mode === 'weight-simulation') return 'dyno-intel-full';
  return 'dyno-intel-trial';
}

function mapUiGateToDynoAccess(gate: UiGateResult): DynoIntelAccessResult {
  if (gate.kind === 'none') return { allowed: true };
  if (gate.kind === 'auth') return { allowed: false, blockReason: 'auth' };
  if (gate.kind === 'core') return { allowed: false, blockReason: 'core-required' };
  return {
    allowed: false,
    blockReason: 'pro-required',
    joinArenaFrom: gate.joinArenaFrom ?? 'dyno-intel',
  };
}

/**
 * Maps DYNO INTEL diagnostic mode to auth / Core / Pro gates.
 * WHY: Core trial (2/day) covers single-axis + cross-axis; weight-simulation stays Pro-only.
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

  const feature = gateFeatureForMode(mode);
  return mapUiGateToDynoAccess(resolveUiGate(feature, ent, authStatus, isAnonymous, now));
}

/**
 * Resolves sheet entry mode from route suggestion — no cross-axis downgrade for Core.
 * WHY: Home/Lobby suggest cross-axis; Core trial now uses the same 2/day bucket for cross-axis.
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

export function canUseDynoIntelTrial(
  ent: EntitlementState,
  authStatus: AuthStatus,
  isAnonymous: boolean,
  now: Date = new Date()
): boolean {
  return resolveDynoIntelAccess('single-axis', ent, authStatus, isAnonymous, now).allowed;
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
