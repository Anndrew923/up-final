import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AssessmentLadderUploadBundle } from '../logic/core/assessmentLadderSupplemental';
import { mergeMergedScoresForAssessmentUpload } from '../logic/core/assessmentLadderSupplemental';
import {
  buildLeaderboardSyncTargets,
  coupleAssessmentSyncTargetsWithOverall,
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
import { getLadderUploadIdentity } from '../services/ladderIdentityService';
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
import { readEntitlementSnapshot } from '../stores/entitlementSelectors';
import { useMergedScoresFromLocalStores } from './useMergedScoresFromLocalStores';
import { resolveLeaderboardUploadGate } from './useLeaderboardUpload';

/** Shared ladder sync API for assessment page bar + breakthrough modal (single hook instance). */
export type AssessmentLadderSyncController = Pick<
  ReturnType<typeof useLeaderboardSyncAssessmentPage>,
  'syncPage' | 'busy' | 'summary' | 'failures' | 'gate' | 'targetCount' | 'goJoinArena' | 'clearFeedback'
>;

export interface UseLeaderboardSyncAssessmentPageOptions {
  scope: AssessmentLadderSyncScope;
  /**
   * Live page scores + six-axis overrides for preview/overall (preferred).
   * Legacy `supplementalTargets` alone does not refresh `mergedForUpload`.
   */
  uploadBundle?: AssessmentLadderUploadBundle | null;
  /** @deprecated Prefer `uploadBundle` — shard list only, no merged overlay. */
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

  const effectiveBundle = useMemo((): AssessmentLadderUploadBundle | null => {
    if (options.uploadBundle) return options.uploadBundle;
    if (options.supplementalTargets?.length) {
      return { supplemental: options.supplementalTargets };
    }
    return null;
  }, [options.uploadBundle, options.supplementalTargets]);

  const mergedForUpload = useMemo(
    () => mergeMergedScoresForAssessmentUpload(merged, effectiveBundle),
    [merged, effectiveBundle]
  );

  const overallScore = useMemo(
    () => calculateSixAxisOverall(mergedForUpload),
    [mergedForUpload]
  );

  const targets = useMemo(() => {
    const profile = loadPhysicalProfile();
    const cardioInputs = loadCardioInputs();
    const all = buildLeaderboardSyncTargets({
      mergedScores: mergedForUpload,
      overallScore,
      profile,
      cardioInputs,
      strengthInputs: loadStrengthInputs(),
      powerInputs: loadPowerInputs(),
      muscleInputs: loadMuscleInputs(),
    });
    const picked = pickLeaderboardSyncTargetsForAssessmentScope(all, options.scope);
    const withSupplemental = mergeLeaderboardSyncTargetsWithSupplemental(
      picked,
      effectiveBundle?.supplemental
    );
    return coupleAssessmentSyncTargetsWithOverall(withSupplemental, overallScore);
  }, [mergedForUpload, overallScore, options.scope, effectiveBundle]);

  const targetsSignature = useMemo(
    () => targets.map((t) => `${t.metric}:${t.score}`).join('|'),
    [targets]
  );

  const authStatus = useAuthStore((s) => s.status);
  const isAnonymous = useAuthStore((s) => s.isAnonymous);

  const gate = useMemo(() => {
    if (targets.length === 0) return 'no-score' as const;
    const maxScore = Math.max(...targets.map((t) => t.score));
    return resolveLeaderboardUploadGate(
      maxScore,
      readEntitlementSnapshot(),
      authStatus,
      isAnonymous
    );
  }, [targets, authStatus, isAnonymous]);

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

    const snap = readEntitlementSnapshot();

    setBusy(true);
    try {
      const ladderProfile = buildLeaderboardProfileProjection(loadPhysicalProfile()) ?? undefined;
      const identity = getLadderUploadIdentity();
      const batch = await runLeaderboardBatchUpload({
        targets,
        uid: user.uid,
        displayName: identity.displayName,
        entitlement: snap,
        previewSnapshot: {
          mergedScores: mergedForUpload,
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
      } else if (batch.failures.some((f) => f.reason === 'avatar-upload-failed')) {
        hapticService.fireLeaderboardUploadResult({
          ok: false,
          reason: 'avatar-upload-failed',
          updated: false,
        });
      }
      queueStructuredProfileAfterRadarSubmit(batch);
      onFinishedRef.current?.();
    } finally {
      setBusy(false);
    }
  }, [targets, gate, targetsSignature, mergedForUpload]);

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
