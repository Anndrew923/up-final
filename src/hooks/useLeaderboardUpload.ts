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
import { syncGuildLadderScore } from '../services/guildCallableService';
import { getLadderUploadIdentity } from '../services/ladderIdentityService';
import {
  submitLeaderboardScore,
  type SubmitLeaderboardResult,
} from '../services/leaderboardService';
import { invalidateGuildLadderCache } from '../services/guildLadderCacheService';
import { buildLeaderboardProfileProjection } from '../logic/core/leaderboardProfileProjection';
import { LEADERBOARD_SHARD_OVERALL } from '../logic/core/assessmentLeaderboardShards';
import { loadPhysicalProfile } from '../services/localStorageService';
import { getMergedScoresSnapshotForRadar } from '../services/mergedLocalScoresSnapshot';
import { useAuthStore } from '../stores/authStore';
import { readEntitlementSnapshot } from '../stores/entitlementSelectors';
import type { EntitlementState } from '../types/entitlement';
import { sanitizeGuildRadarScores } from '../logic/core/guildRadarScores';

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
 * Intent-driven single-shard upload.
 * - `upload` → public shards (Pro + identity)
 * - `uploadGuildOnly` → club roster + six-axis radarScores (Free OK)
 * WHY: Batch Sync All / assessment page use dedicated hooks; this remains the per-shard intent API.
 */
export function useLeaderboardUpload() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<SubmitLeaderboardResult | null>(null);

  const uploadGuildOnly = useCallback(async (score: number) => {
    setLastResult(null);
    const user = getCurrentFirebaseUser();
    if (!user || user.isAnonymous) return;
    if (!(score > 0)) {
      setLastResult({
        ok: false,
        reason: 'unknown',
        updated: false,
        previousScore: null,
        submittedScore: null,
      });
      return;
    }

    setBusy(true);
    try {
      const identity = getLadderUploadIdentity();
      const profile = buildLeaderboardProfileProjection(loadPhysicalProfile());
      const radarScores = sanitizeGuildRadarScores(getMergedScoresSnapshotForRadar());
      const result = await syncGuildLadderScore({
        ladderScore: score,
        displayName: identity?.displayName,
        avatarUrl: identity?.avatarUrl,
        isAnonymous: profile?.isAnonymousInLadder === true,
        ...(radarScores ? { radarScores } : {}),
      });
      if (result.ok && !result.skipped) {
        invalidateGuildLadderCache(result.guildId ?? undefined);
        const okResult: SubmitLeaderboardResult = {
          ok: true,
          updated: true,
          previousScore: null,
          submittedScore: score,
          improved: true,
        };
        setLastResult(okResult);
        hapticService.fireLeaderboardUploadResult(okResult);
      } else if (result.ok && result.skipped) {
        setLastResult({
          ok: true,
          reason: 'unchanged',
          updated: false,
          previousScore: null,
          submittedScore: score,
        });
      } else {
        const failed: SubmitLeaderboardResult = {
          ok: false,
          reason: 'unknown',
          updated: false,
          previousScore: null,
          submittedScore: null,
        };
        setLastResult(failed);
        hapticService.fireLeaderboardUploadResult(failed);
      }
    } catch {
      const failed = { ok: false, reason: 'unknown' as const, updated: false };
      setLastResult(failed);
      hapticService.fireLeaderboardUploadResult(failed);
    } finally {
      setBusy(false);
    }
  }, []);

  const upload = useCallback(async (metric: LeaderboardShardId, score: number) => {
    setLastResult(null);

    const user = getCurrentFirebaseUser();
    if (!user || user.isAnonymous) return;

    if (resolveLeaderboardUploadGate(score) !== 'ok') return;

    const identity = getLadderUploadIdentity();
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
      if (
        result.ok &&
        metric === LEADERBOARD_SHARD_OVERALL &&
        (result.updated || result.avatarPatched || result.identityPatched)
      ) {
        invalidateGuildLadderCache();
      }
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

  return { upload, uploadGuildOnly, busy, lastResult, goJoinArena, clearFeedback };
}
