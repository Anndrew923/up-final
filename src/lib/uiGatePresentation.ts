import type { UiGateResult } from '../logic/core/entitlement';
import type { GateSheetKind } from '../types/uiGate';

export function gateSheetKindFromUiGate(uiGate: UiGateResult): GateSheetKind | null {
  if (uiGate.kind === 'auth' || uiGate.kind === 'pro') return uiGate.kind;
  return null;
}
