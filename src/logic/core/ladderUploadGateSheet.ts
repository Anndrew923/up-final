import type { GateSheetKind } from '../../types/uiGate';
import type { LeaderboardUploadGate } from './ladderUploadGate';

/** True when upload is blocked and a gate sheet should surface (auth/pro). */
export function shouldOpenLadderUploadGateSheet(
  gate: LeaderboardUploadGate,
  gateSheetKind: GateSheetKind | null
): boolean {
  return gate !== 'ok' && gateSheetKind != null;
}
