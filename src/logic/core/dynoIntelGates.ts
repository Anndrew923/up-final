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

export type DynoIntelBlockReason = 'auth' | 'core-required' | 'pro-required';

export interface DynoIntelAccessResult {
  allowed: boolean;
  blockReason?: DynoIntelBlockReason;
  joinArenaFrom?: UiGateJoinArenaFrom;
}

function gateFeatureForMode(mode: DynoIntelMode): 'dyno-intel-trial' | 'dyno-intel-full' {
  return mode === 'single-axis' ? 'dyno-intel-trial' : 'dyno-intel-full';
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
 * WHY: Trial (single-axis, 2/day) is Core-only bait; cross-axis and weight-sim require Pro.
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

  const feature = gateFeatureForMode(mode);
  return mapUiGateToDynoAccess(resolveUiGate(feature, ent, authStatus, isAnonymous, now));
}

/**
 * Resolves sheet entry mode — non-Pro users on cross-axis surfaces fall back to single-axis trial.
 * WHY: Home/Lobby suggest cross-axis but Core bait must still open the console.
 */
export function resolveDynoIntelSheetEntry(
  suggestedMode: DynoIntelMode,
  ent: EntitlementState,
  authStatus: AuthStatus,
  isAnonymous: boolean,
  now: Date = new Date()
): { openMode: DynoIntelMode; access: DynoIntelAccessResult } {
  const primary = resolveDynoIntelAccess(suggestedMode, ent, authStatus, isAnonymous, now);
  if (primary.allowed) {
    return { openMode: suggestedMode, access: primary };
  }

  if (suggestedMode !== 'single-axis') {
    const trial = resolveDynoIntelAccess('single-axis', ent, authStatus, isAnonymous, now);
    if (trial.allowed) {
      return { openMode: 'single-axis', access: trial };
    }
    return { openMode: suggestedMode, access: trial };
  }

  return { openMode: suggestedMode, access: primary };
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
  return hasProAccess(ent, now);
}

export function canUseDynoIntelMode(
  mode: DynoIntelMode,
  ent: EntitlementState,
  authStatus: AuthStatus,
  isAnonymous: boolean,
  now: Date = new Date()
): boolean {
  if (mode === 'single-axis') {
    return canUseDynoIntelTrial(ent, authStatus, isAnonymous, now);
  }
  return canUseDynoIntelFull(ent, authStatus, isAnonymous, now);
}
