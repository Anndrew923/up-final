import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AssessmentLadderUploadBundle } from '../logic/core/assessmentLadderSupplemental';
import { mergeMergedScoresForAssessmentUpload } from '../logic/core/assessmentLadderSupplemental';
import { sanitizeGuildRadarScores } from '../logic/core/guildRadarScores';
import { resolveMembershipSyncSurface } from '../logic/core/membershipSyncSurface';
import {
  buildLeaderboardSyncTargets,
  coupleAssessmentSyncTargetsWithOverall,
  createEmptyLeaderboardSyncRunSummary,
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
import { syncGuildLadderScore } from '../services/guildCallableService';
import {
  fetchUserGuildBinding,
  invalidateGuildLadderCache,
} from '../services/guildLadderCacheService';
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
  | 'syncPageGlobal'
  | 'syncPageGuild'
  | 'busy'
  | 'summary'
  | 'failures'
  | 'gate'
  | 'targetCount'
  | 'overallScore'
  | 'goJoinArena'
  | 'clearFeedback'
  | 'hasGuild'
  | 'membershipSurface'
  | 'lastCloudOutcome'
>;

export type AssessmentSyncCloudOutcome = 'arena' | 'guild' | null;

export interface UseLeaderboardSyncAssessmentPageOptions {
  scope: AssessmentLadderSyncScope;
  uploadBundle?: AssessmentLadderUploadBundle | null;
  /** @deprecated Prefer `uploadBundle` — shard list only, no merged overlay. */
  supplementalTargets?: LeaderboardSyncTarget[];
  onFinished?: () => void;
}

/**
 * Intent-driven assessment sync — global shards vs club-only overall (+ radarScores).
 */
export function useLeaderboardSyncAssessmentPage(options: UseLeaderboardSyncAssessmentPageOptions) {
  const navigate = useNavigate();
  const onFinishedRef = useRef(options.onFinished);
  useEffect(() => {
    onFinishedRef.current = options.onFinished;
  }, [options.onFinished]);

  const merged = useMergedScoresFromLocalStores();
  const authUid = useAuthStore((s) => s.uid);

  const [hasGuild, setHasGuild] = useState<boolean | null>(null);
  const [lastCloudOutcome, setLastCloudOutcome] = useState<AssessmentSyncCloudOutcome>(null);

  useEffect(() => {
    let cancelled = false;
    if (!authUid) {
      setHasGuild(false);
      return;
    }
    setHasGuild(null);
    void fetchUserGuildBinding(authUid).then((binding) => {
      if (!cancelled) setHasGuild(Boolean(binding?.guildId));
    });
    return () => {
      cancelled = true;
    };
  }, [authUid]);

  const membershipSurface = useMemo(
    () => resolveMembershipSyncSurface(hasGuild),
    [hasGuild]
  );

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

  const clearFeedback = useCallback(() => {
    setSummaryState(null);
    setLastCloudOutcome(null);
  }, []);
  const summary = summaryState?.signature === targetsSignature ? summaryState.summary : null;
  const failures =
    summaryState?.signature === targetsSignature ? summaryState.failures : [];

  const goJoinArena = useCallback(() => {
    navigate(joinArenaPath('ladder'));
  }, [navigate]);

  const targetsRef = useRef(targets);
  const mergedForUploadRef = useRef(mergedForUpload);
  const targetsSignatureRef = useRef(targetsSignature);
  const gateRef = useRef(gate);
  const overallScoreRef = useRef(overallScore);
  targetsRef.current = targets;
  mergedForUploadRef.current = mergedForUpload;
  targetsSignatureRef.current = targetsSignature;
  gateRef.current = gate;
  overallScoreRef.current = overallScore;

  const syncPageGuild = useCallback(async () => {
    const activeMerged = mergedForUploadRef.current;
    const activeSignature = targetsSignatureRef.current;
    const activeOverall = overallScoreRef.current;

    setSummaryState(null);
    setLastCloudOutcome(null);

    if (!Number.isFinite(activeOverall) || activeOverall <= 0) return;

    const user = getCurrentFirebaseUser();
    if (!user || user.isAnonymous) return;

    setBusy(true);
    try {
      const identity = getLadderUploadIdentity();
      const profile = buildLeaderboardProfileProjection(loadPhysicalProfile());
      const radarScores = sanitizeGuildRadarScores(activeMerged);
      const result = await syncGuildLadderScore({
        ladderScore: activeOverall,
        displayName: identity?.displayName,
        avatarUrl: identity?.avatarUrl,
        isAnonymous: profile?.isAnonymousInLadder === true,
        ...(radarScores ? { radarScores } : {}),
      });
      if (!result.ok) {
        setSummaryState({
          signature: activeSignature,
          summary: createEmptyLeaderboardSyncRunSummary(),
          failures: [{ metric: 'ladderScore', reason: result.reason }],
        });
        setLastCloudOutcome(null);
        return;
      }
      if (result.skipped) {
        setLastCloudOutcome(null);
        onFinishedRef.current?.();
        return;
      }
      invalidateGuildLadderCache(result.guildId ?? undefined);
      const tally = createEmptyLeaderboardSyncRunSummary();
      tally.attempted = 1;
      tally.updated = 1;
      setSummaryState({
        signature: activeSignature,
        summary: tally,
        failures: [],
      });
      setLastCloudOutcome('guild');
      void hapticService.trigger('success');
      onFinishedRef.current?.();
    } finally {
      setBusy(false);
    }
  }, []);

  const syncPageGlobal = useCallback(async () => {
    const activeTargets = targetsRef.current;
    const activeMerged = mergedForUploadRef.current;
    const activeSignature = targetsSignatureRef.current;
    const activeGate = gateRef.current;

    setSummaryState(null);
    setLastCloudOutcome(null);

    if (activeTargets.length === 0 || activeGate !== 'ok') return;

    const user = getCurrentFirebaseUser();
    if (!user || user.isAnonymous) return;

    const snap = readEntitlementSnapshot();
    setBusy(true);
    try {
      const ladderProfile = buildLeaderboardProfileProjection(loadPhysicalProfile()) ?? undefined;
      const identity = getLadderUploadIdentity();
      if (!identity) return;

      const batch = await runLeaderboardBatchUpload({
        targets: activeTargets,
        uid: user.uid,
        displayName: identity.displayName,
        entitlement: snap,
        previewSnapshot: {
          mergedScores: activeMerged,
          profile: ladderProfile,
          avatarUrl: identity.avatarUrl,
        },
      });
      setSummaryState({
        signature: activeSignature,
        summary: batch.summary,
        failures: batch.failures,
      });
      setLastCloudOutcome('arena');
      if (
        batch.summary.updated > 0 ||
        (batch.summary.avatarPatched ?? 0) > 0 ||
        (batch.summary.identityPatched ?? 0) > 0
      ) {
        void hapticService.trigger('success');
      } else if (batch.failures.some((f) => f.reason === 'avatar-upload-failed')) {
        hapticService.fireLeaderboardUploadResult({
          ok: false,
          reason: 'avatar-upload-failed',
          updated: false,
        });
      }
      void queueStructuredProfileAfterRadarSubmit(batch);
      onFinishedRef.current?.();
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    syncPageGlobal,
    syncPageGuild,
    busy,
    summary,
    failures,
    gate,
    targetCount: targets.length,
    overallScore,
    goJoinArena,
    clearFeedback,
    hasGuild,
    membershipSurface,
    lastCloudOutcome,
  };
}
