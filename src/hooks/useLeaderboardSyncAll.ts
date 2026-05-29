import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  buildLeaderboardSyncTargets,
  type LadderSyncShardFailure,
  type LeaderboardSyncRunSummary,
} from '../logic/core/leaderboardSyncTargets';
import { buildLeaderboardProfileProjection } from '../logic/core/leaderboardProfileProjection';
import { calculateSixAxisOverall } from '../logic/core/scoring';
import { joinArenaPath } from '../lib/joinArenaNavigation';
import { hapticService } from '../services/hapticService';
import { getCurrentFirebaseUser } from '../services/firebaseClient';
import { getLeaderboardIdentityPayload } from '../services/ladderIdentityService';
import {
  checkFullSyncAllowed,
  recordFullSyncAllowed,
} from '../services/fullSyncRateLimitService';
import { runLeaderboardBatchUpload } from '../services/leaderboardBatchUploadService';
import type { FullSyncRateLimitCheck } from '../logic/core/fullSyncRateLimit';
import {
  loadCardioInputs,
  loadMuscleInputs,
  loadPhysicalProfile,
  loadPowerInputs,
  loadStrengthInputs,
} from '../services/localStorageService';
import { useAuthStore } from '../stores/authStore';
import { useEntitlementStore } from '../stores/entitlementStore';
import type { EntitlementState } from '../types/entitlement';
import { useMergedScoresFromLocalStores } from './useMergedScoresFromLocalStores';
import { resolveLeaderboardUploadGate } from './useLeaderboardUpload';

export type LeaderboardSyncAllSummary = LeaderboardSyncRunSummary;

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

export interface UseLeaderboardSyncAllOptions {
  onFinished?: () => void;
}

/**
 * Sequential multi-shard ladder upload using the same merged score map as Home radar.
 * Respects `submitLeaderboardScore` + per-shard rate limits; summarizes outcomes for UI.
 */
export function useLeaderboardSyncAll(options?: UseLeaderboardSyncAllOptions) {
  const navigate = useNavigate();
  const onFinishedRef = useRef(options?.onFinished);
  useEffect(() => {
    onFinishedRef.current = options?.onFinished;
  }, [options?.onFinished]);

  const merged = useMergedScoresFromLocalStores();
  const overallScore = useMemo(() => calculateSixAxisOverall(merged), [merged]);

  const targets = useMemo(() => {
    const profile = loadPhysicalProfile();
    const cardioInputs = loadCardioInputs();
    return buildLeaderboardSyncTargets({
      mergedScores: merged,
      overallScore,
      profile,
      cardioInputs,
      strengthInputs: loadStrengthInputs(),
      powerInputs: loadPowerInputs(),
      muscleInputs: loadMuscleInputs(),
    });
  }, [merged, overallScore]);

  const targetsSignature = useMemo(
    () => targets.map((t) => `${t.metric}:${t.score}`).join('|'),
    [targets]
  );

  const gate = useMemo(() => {
    if (targets.length === 0) return 'no-score' as const;
    const maxScore = Math.max(...targets.map((t) => t.score));
    return resolveLeaderboardUploadGate(maxScore);
  }, [targets]);

  const [busy, setBusy] = useState(false);
  const [fullSyncBlock, setFullSyncBlock] = useState<FullSyncRateLimitCheck | null>(null);
  const [summaryState, setSummaryState] = useState<{
    signature: string;
    summary: LeaderboardSyncRunSummary;
    failures: LadderSyncShardFailure[];
  } | null>(null);

  const clearFeedback = useCallback(() => {
    setSummaryState(null);
  }, []);

  const refreshFullSyncBlock = useCallback((uid: string) => {
    const check = checkFullSyncAllowed(uid);
    setFullSyncBlock(check.allowed ? null : check);
  }, []);
  const summary = summaryState?.signature === targetsSignature ? summaryState.summary : null;
  const failures =
    summaryState?.signature === targetsSignature ? summaryState.failures : [];

  const uid = useAuthStore((s) => s.uid);
  const isAnonymous = useAuthStore((s) => s.isAnonymous);

  useEffect(() => {
    if (!uid || isAnonymous || gate !== 'ok') {
      setFullSyncBlock(null);
      return;
    }
    refreshFullSyncBlock(uid);
  }, [uid, isAnonymous, gate, refreshFullSyncBlock]);

  const goJoinArena = useCallback(() => {
    navigate(joinArenaPath('ladder'));
  }, [navigate]);

  const syncAll = useCallback(async () => {
    setSummaryState(null);
    if (targets.length === 0 || gate !== 'ok') return;

    const user = getCurrentFirebaseUser();
    if (!user || user.isAnonymous) return;

    const fullSyncGate = checkFullSyncAllowed(user.uid);
    if (!fullSyncGate.allowed) {
      setFullSyncBlock(fullSyncGate);
      return;
    }

    const displayName = useAuthStore.getState().displayName?.trim() || 'Pilot';
    const snap = buildEntitlementSnapshot();

    setBusy(true);
    try {
      const ladderProfile = buildLeaderboardProfileProjection(loadPhysicalProfile()) ?? undefined;
      const identity = getLeaderboardIdentityPayload();
      const batch = await runLeaderboardBatchUpload({
        targets,
        uid: user.uid,
        displayName,
        entitlement: snap,
        fullSync: true,
        previewSnapshot: {
          mergedScores: merged,
          profile: ladderProfile,
          avatarUrl: identity.avatarUrl,
        },
      });

      if (batch.fullSyncBlock) {
        setFullSyncBlock({
          allowed: false,
          reason: batch.fullSyncBlock.reason,
          nextAllowedAt: batch.fullSyncBlock.nextAllowedAt,
          remainingToday: 0,
        });
        return;
      }

      const tally = batch.summary;
      if (tally.updated > 0) {
        recordFullSyncAllowed(user.uid);
        refreshFullSyncBlock(user.uid);
      }
      setSummaryState({ signature: targetsSignature, summary: tally, failures: batch.failures });
      if (tally.updated > 0) {
        void hapticService.trigger('success');
      }
      onFinishedRef.current?.();
    } finally {
      setBusy(false);
    }
  }, [targets, gate, targetsSignature, merged, refreshFullSyncBlock]);

  return {
    syncAll,
    busy,
    summary,
    failures,
    fullSyncBlock,
    gate,
    targetCount: targets.length,
    goJoinArena,
    clearFeedback,
  };
}
