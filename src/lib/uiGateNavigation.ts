import type { NavigateFunction } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { joinArenaPath } from './joinArenaNavigation';
import type { UiGateResult } from '../logic/core/entitlement';

/** Resolves navigation targets from a pure UI gate decision. */
export function uiGateNextRoute(gate: UiGateResult, returnTo?: string): string | undefined {
  if (gate.kind === 'auth') return ROUTES.authChoice;
  if (gate.kind === 'pro' && gate.joinArenaFrom) {
    // WHY: Pro funnel must carry allowlisted returnTo so backup/dyno don't hard-dump onto ladder.
    return joinArenaPath(gate.joinArenaFrom, returnTo);
  }
  return undefined;
}

/**
 * Navigates from a resolveUiGate result — auth gates carry returnTo for post-login redirect;
 * Pro gates embed returnTo in the Join Arena query string.
 */
export function navigateFromUiGate(
  navigate: NavigateFunction,
  gate: UiGateResult,
  returnTo?: string
): void {
  const nextRoute = uiGateNextRoute(gate, returnTo);
  if (!nextRoute) return;
  if (gate.kind === 'auth') {
    navigate(nextRoute, returnTo != null ? { state: { returnTo } } : undefined);
    return;
  }
  navigate(nextRoute);
}
