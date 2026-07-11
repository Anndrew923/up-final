import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hapticService } from '../services/hapticService';
import type { AuthStatus } from '../logic/core/entitlement';
import {
  resolveLeaderboardUploadGate as evaluateLeaderboardUploadGate,
  type LeaderboardUploadGate,
} from '../logic/core/ladderUploadGate';
import type { LeaderboardShardId } from '../logic/core/ladderShards';
import { joinArenaPath } from '../lib/joinArenaNavigation';
import { getCurrentFirebaseUser } from '../services/firebaseClient';
import { getLadderUploadIdentity } from '../services/ladderIdentityService';
import {
  submitLeaderboardScore,
  type SubmitLeaderboardResult,
} from '../services/leaderboardService';
import { useAuthStore } from '../stores/authStore';
import { readEntitlementSnapshot } from '../stores/entitlementSelectors';
import type { EntitlementState } from '../types/entitlement';

export type { LeaderboardUploadGate } from '../logic/core/ladderUploadGate';

/** Store-aware facade over pure `logic/core/ladderUploadGate` (default entitlement/auth snapshot). */
export function resolveLeaderboardUploadGate(
  score: number | null | undefined,
  ent: EntitlementState = readEntitlementSnapshot(),
  authStatus: AuthStatus = useAuthStore.getState().status,
  isAnonymous: boolean = useAuthStore.getState().isAnonymous
): LeaderboardUploadGate {
  return evaluateLeaderboardUploadGate(score, ent, authStatus, isAnonymous);
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

    const identity = getLadderUploadIdentity();
    // WHY: Hard gate — empty display name must never reach Firestore as a ghost nickname.
    if (!identity) return;

    setBusy(true);
    try {
      const result = await submitLeaderboardScore({
        entitlement: readEntitlementSnapshot(),
        input: {
          uid: user.uid,
          metric,
          score,
          displayName: identity.displayName,
          avatarUrl: identity.avatarUrl,
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
