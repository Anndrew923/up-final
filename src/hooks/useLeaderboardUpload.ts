import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hapticService } from '../services/hapticService';
import { canUploadLeaderboard } from '../logic/core/entitlement';
import type { LeaderboardShardId } from '../logic/core/ladderShards';
import { joinArenaPath } from '../lib/joinArenaNavigation';
import { getCurrentFirebaseUser } from '../services/firebaseClient';
import {
  submitLeaderboardScore,
  type SubmitLeaderboardResult,
} from '../services/leaderboardService';
import { useAuthStore } from '../stores/authStore';
import { useEntitlementStore } from '../stores/entitlementStore';
import type { EntitlementState } from '../types/entitlement';

function buildEntitlementSnapshot(): EntitlementState {
  const s = useEntitlementStore.getState();
  return {
    purchaseStatus: s.purchaseStatus,
    subscriptionStatus: s.subscriptionStatus,
    isPro: s.isPro,
    proExpiresAt: s.proExpiresAt,
    planId: s.planId,
    lastCheckedAt: s.lastCheckedAt,
  };
}

export type LeaderboardUploadGate =
  | 'ok'
  | 'no-score'
  | 'signed-out'
  | 'anonymous'
  | 'no-pro'
  | 'invalid-score';

export function resolveLeaderboardUploadGate(
  score: number | null | undefined
): LeaderboardUploadGate {
  if (score === null || score === undefined || !Number.isFinite(score) || score <= 0) {
    return 'no-score';
  }
  const user = getCurrentFirebaseUser();
  if (!user) return 'signed-out';
  if (user.isAnonymous) return 'anonymous';
  if (!canUploadLeaderboard(buildEntitlementSnapshot())) return 'no-pro';
  return 'ok';
}

/**
 * Pro + signed-in upload to `leaderboardService` (display name from auth store; ladder identity merged in service).
 */
export function useLeaderboardUpload() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<SubmitLeaderboardResult | null>(null);

  const upload = useCallback(async (metric: LeaderboardShardId, score: number) => {
    setLastResult(null);
    if (resolveLeaderboardUploadGate(score) !== 'ok') return;

    const user = getCurrentFirebaseUser();
    if (!user || user.isAnonymous) return;

    const displayName = useAuthStore.getState().displayName?.trim() || 'Pilot';
    setBusy(true);
    try {
      const result = await submitLeaderboardScore({
        entitlement: buildEntitlementSnapshot(),
        input: {
          uid: user.uid,
          metric,
          score,
          displayName,
        },
      });
      setLastResult(result);
      hapticService.fireLeaderboardUploadResult(result);
    } catch {
      const failed = { ok: false, reason: 'unknown' as const, updated: false };
      setLastResult(failed);
      hapticService.fireLeaderboardUploadResult(failed);
    } finally {
      setBusy(false);
    }
  }, []);

  const goJoinArena = useCallback(() => {
    navigate(joinArenaPath('ladder'));
  }, [navigate]);

  const clearFeedback = useCallback(() => setLastResult(null), []);

  return { upload, busy, lastResult, goJoinArena, clearFeedback };
}
