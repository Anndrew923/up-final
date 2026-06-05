import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { navigateFromUiGate } from '../lib/uiGateNavigation';
import { MONETIZATION_CONFIG } from '../config/monetization';
import { resolveLeaderboardAccessReason } from '../logic/core/entitlement';
import { useAuthStore } from '../stores/authStore';
import { useEntitlementStore } from '../stores/entitlementStore';
import { useShallow } from 'zustand/react/shallow';
import { selectEntitlementState } from '../stores/entitlementSelectors';
import { useUiGate } from './useUiGate';

export interface LeaderboardAccessResult {
  canEnter: boolean;
  shouldShowJoinArena: boolean;
  reason:
    | 'ok'
    | 'open-access'
    | 'auth-required'
    | 'core-not-owned'
    | 'pro-required'
    | 'pro-expired';
  goToLeaderboard(): void;
  goToJoinArena(): void;
}

export function useLeaderboardAccess(): LeaderboardAccessResult {
  const navigate = useNavigate();
  const authStatus = useAuthStore((state) => state.status);
  const entitlement = useEntitlementStore(useShallow(selectEntitlementState));
  const uiGate = useUiGate('ladder-read');

  const reason = useMemo(
    () => resolveLeaderboardAccessReason(uiGate, entitlement),
    [uiGate, entitlement]
  );

  const goToLeaderboard = useCallback(() => {
    navigate(ROUTES.ladder);
  }, [navigate]);

  const goToJoinArena = useCallback(() => {
    navigateFromUiGate(navigate, uiGate, ROUTES.ladder);
  }, [navigate, uiGate]);

  return {
    canEnter: authStatus !== 'loading' && uiGate.kind === 'none',
    shouldShowJoinArena:
      uiGate.kind === 'pro' && MONETIZATION_CONFIG.leaderboardPaywallEnabled,
    reason,
    goToLeaderboard,
    goToJoinArena,
  };
}
