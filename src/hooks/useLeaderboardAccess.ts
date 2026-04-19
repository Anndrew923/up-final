import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { getEntitlementReasonCode } from '../logic/core/entitlement';
import { useEntitlementStore } from '../stores/entitlementStore';

export interface LeaderboardAccessResult {
  canEnter: boolean;
  shouldShowJoinArena: boolean;
  reason: 'ok' | 'core-not-owned' | 'pro-required' | 'pro-expired';
  goToLeaderboard(): void;
  goToJoinArena(): void;
}

export function useLeaderboardAccess(): LeaderboardAccessResult {
  const navigate = useNavigate();
  const purchaseStatus = useEntitlementStore((state) => state.purchaseStatus);
  const subscriptionStatus = useEntitlementStore((state) => state.subscriptionStatus);
  const isPro = useEntitlementStore((state) => state.isPro);
  const proExpiresAt = useEntitlementStore((state) => state.proExpiresAt);
  const planId = useEntitlementStore((state) => state.planId);
  const lastCheckedAt = useEntitlementStore((state) => state.lastCheckedAt);

  const reason = useMemo(
    () =>
      getEntitlementReasonCode(
        {
          purchaseStatus,
          subscriptionStatus,
          isPro,
          proExpiresAt,
          planId,
          lastCheckedAt,
        },
        'leaderboard-read'
      ),
    [purchaseStatus, subscriptionStatus, isPro, proExpiresAt, planId, lastCheckedAt]
  );

  const goToLeaderboard = useCallback(() => {
    navigate(ROUTES.ladder);
  }, [navigate]);

  const goToJoinArena = useCallback(() => {
    navigate(ROUTES.joinArena);
  }, [navigate]);

  return {
    canEnter: reason === 'ok',
    shouldShowJoinArena: reason === 'pro-required' || reason === 'pro-expired',
    reason,
    goToLeaderboard,
    goToJoinArena,
  };
}
