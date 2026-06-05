import type { NavigateFunction } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { joinArenaPath } from './joinArenaNavigation';
import type { UiGateResult } from '../logic/core/entitlement';

/** Resolves navigation targets from a pure UI gate decision. */
export function uiGateNextRoute(gate: UiGateResult): string | undefined {
  if (gate.kind === 'auth') return ROUTES.authChoice;
  if (gate.kind === 'pro' && gate.joinArenaFrom) {
    return joinArenaPath(gate.joinArenaFrom);
  }
  return undefined;
}

/**
 * Navigates from a resolveUiGate result — auth gates carry returnTo for post-login redirect.
 */
export function navigateFromUiGate(
  navigate: NavigateFunction,
  gate: UiGateResult,
  returnTo?: string
): void {
  const nextRoute = uiGateNextRoute(gate);
  if (!nextRoute) return;
  if (gate.kind === 'auth') {
    navigate(nextRoute, returnTo != null ? { state: { returnTo } } : undefined);
    return;
  }
  navigate(nextRoute);
}
