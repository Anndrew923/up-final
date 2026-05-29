import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  buildLeaderboardSyncTargets,
  mergeLeaderboardSyncTargetsWithSupplemental,
  pickLeaderboardSyncTargetsForAssessmentScope,
  type AssessmentLadderSyncScope,
  type LadderSyncShardFailure,
  type LeaderboardSyncRunSummary,
  type LeaderboardSyncTarget,
} from '../logic/core/leaderboardSyncTargets';
import { buildLeaderboardProfileProjection } from '../logic/core/leaderboardProfileProjection';
import { calculateSixAxisOverall } from '../logic/core/scoring';
import { joinArenaPath } from '../lib/joinArenaNavigation';
import { hapticService } from '../services/hapticService';
import { getCurrentFirebaseUser } from '../services/firebaseClient';
import { getLeaderboardIdentityPayload } from '../services/ladderIdentityService';
import { runLeaderboardBatchUpload } from '../services/leaderboardBatchUploadService';
import { queueStructuredProfileAfterRadarSubmit } from '../services/structuredSyncAfterRadarSubmit';
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

export interface UseLeaderboardSyncAssessmentPageOptions {
  scope: AssessmentLadderSyncScope;
  /** Page-only scores not yet reflected in `useMergedScoresFromLocalStores` (e.g. arm preview). */
  supplementalTargets?: LeaderboardSyncTarget[];
  onFinished?: () => void;
}

/**
 * One button → sequential uploads for every ladder shard that belongs to the current assessment page.
 */
export function useLeaderboardSyncAssessmentPage(options: UseLeaderboardSyncAssessmentPageOptions) {
  const navigate = useNavigate();
  const onFinishedRef = useRef(options.onFinished);
  useEffect(() => {
    onFinishedRef.current = options.onFinished;
  }, [options.onFinished]);

  const merged = useMergedScoresFromLocalStores();
  const overallScore = useMemo(() => calculateSixAxisOverall(merged), [merged]);

  const targets = useMemo(() => {
    const profile = loadPhysicalProfile();
    const cardioInputs = loadCardioInputs();
    const all = buildLeaderboardSyncTargets({
      mergedScores: merged,
      overallScore,
      profile,
      cardioInputs,
      strengthInputs: loadStrengthInputs(),
      powerInputs: loadPowerInputs(),
      muscleInputs: loadMuscleInputs(),
    });
    const picked = pickLeaderboardSyncTargetsForAssessmentScope(all, options.scope);
    return mergeLeaderboardSyncTargetsWithSupplemental(picked, options.supplementalTargets);
  }, [merged, overallScore, options.scope, options.supplementalTargets]);

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
  const [summaryState, setSummaryState] = useState<{
    signature: string;
    summary: LeaderboardSyncRunSummary;
    failures: LadderSyncShardFailure[];
  } | null>(null);

  const clearFeedback = useCallback(() => setSummaryState(null), []);
  const summary = summaryState?.signature === targetsSignature ? summaryState.summary : null;
  const failures =
    summaryState?.signature === targetsSignature ? summaryState.failures : [];

  const goJoinArena = useCallback(() => {
    navigate(joinArenaPath('ladder'));
  }, [navigate]);

  const syncPage = useCallback(async () => {
    setSummaryState(null);
    if (targets.length === 0 || gate !== 'ok') return;

    const user = getCurrentFirebaseUser();
    if (!user || user.isAnonymous) return;

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
        previewSnapshot: {
          mergedScores: merged,
          profile: ladderProfile,
          avatarUrl: identity.avatarUrl,
        },
      });
      setSummaryState({
        signature: targetsSignature,
        summary: batch.summary,
        failures: batch.failures,
      });
      if (batch.summary.updated > 0) {
        void hapticService.trigger('success');
      }
      queueStructuredProfileAfterRadarSubmit();
      onFinishedRef.current?.();
    } finally {
      setBusy(false);
    }
  }, [targets, gate, targetsSignature, merged]);

  return {
    syncPage,
    busy,
    summary,
    failures,
    gate,
    targetCount: targets.length,
    goJoinArena,
    clearFeedback,
  };
}
