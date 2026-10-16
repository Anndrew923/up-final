import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AssessmentLadderUploadBundle } from '../logic/core/assessmentLadderSupplemental';
import { mergeMergedScoresForAssessmentUpload } from '../logic/core/assessmentLadderSupplemental';
import {
  resolvePublishMode,
  type LadderPublishPreference,
} from '../logic/core/ladderPublishPreference';
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
import {
  LADDER_PUBLISH_PREFERENCE_CHANGED_EVENT,
  loadWantsGlobalLadderPublish,
  saveWantsGlobalLadderPublish,
} from '../services/ladderPublishPreferenceStorage';
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
  | 'syncPage'
  | 'busy'
  | 'summary'
  | 'failures'
  | 'gate'
  | 'targetCount'
  | 'overallScore'
  | 'goJoinArena'
  | 'clearFeedback'
  | 'wantsGlobalLadder'
  | 'setWantsGlobalLadder'
  | 'hasGuild'
  | 'publishMode'
  | 'lastCloudOutcome'
>;

export type AssessmentSyncCloudOutcome = 'arena' | 'guild' | 'local' | null;

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
 * Privacy Phase 1: may instead sync crew-only overall score or skip cloud entirely.
 */
export function useLeaderboardSyncAssessmentPage(options: UseLeaderboardSyncAssessmentPageOptions) {
  const navigate = useNavigate();
  const onFinishedRef = useRef(options.onFinished);
  useEffect(() => {
    onFinishedRef.current = options.onFinished;
  }, [options.onFinished]);

  const merged = useMergedScoresFromLocalStores();
  const authUid = useAuthStore((s) => s.uid);

  const [wantsGlobalLadder, setWantsGlobalLadderState] = useState(() =>
    loadWantsGlobalLadderPublish()
  );
  /** null = binding still loading — prevents local-only flash for crew members. */
  const [hasGuild, setHasGuild] = useState<boolean | null>(null);
  const [lastCloudOutcome, setLastCloudOutcome] = useState<AssessmentSyncCloudOutcome>(null);

  const setWantsGlobalLadder = useCallback((next: boolean) => {
    setWantsGlobalLadderState(next);
    saveWantsGlobalLadderPublish(next);
  }, []);

  useEffect(() => {
    const onPrefChanged = () => {
      setWantsGlobalLadderState(loadWantsGlobalLadderPublish());
    };
    window.addEventListener(LADDER_PUBLISH_PREFERENCE_CHANGED_EVENT, onPrefChanged);
    return () => {
      window.removeEventListener(LADDER_PUBLISH_PREFERENCE_CHANGED_EVENT, onPrefChanged);
    };
  }, []);

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

  const publishMode = useMemo(
    () => resolvePublishMode(wantsGlobalLadder, hasGuild),
    [wantsGlobalLadder, hasGuild]
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
  const publishModeRef = useRef(publishMode);
  const overallScoreRef = useRef(overallScore);
  targetsRef.current = targets;
  mergedForUploadRef.current = mergedForUpload;
  targetsSignatureRef.current = targetsSignature;
  gateRef.current = gate;
  publishModeRef.current = publishMode;
  overallScoreRef.current = overallScore;

  const syncPage = useCallback(async () => {
    const mode: LadderPublishPreference = publishModeRef.current;
    const activeTargets = targetsRef.current;
    const activeMerged = mergedForUploadRef.current;
    const activeSignature = targetsSignatureRef.current;
    const activeGate = gateRef.current;
    const activeOverall = overallScoreRef.current;

    setSummaryState(null);
    setLastCloudOutcome(null);

    // Binding still resolving — modal disables CTA; no-op if called early.
    if (mode === 'pending') return;

    // Local-only: caller already persisted dashboard; no cloud I/O.
    if (mode === 'local-only') {
      setLastCloudOutcome('local');
      onFinishedRef.current?.();
      return;
    }

    const user = getCurrentFirebaseUser();
    if (!user || user.isAnonymous) return;

    if (mode === 'guild-only') {
      if (!Number.isFinite(activeOverall) || activeOverall <= 0) return;
      setBusy(true);
      try {
        // WHY: Crew sync must not require Arena identity sheet — Free trainees may lack nickname.
        const identity = getLadderUploadIdentity();
        const profile = buildLeaderboardProfileProjection(loadPhysicalProfile());
        const result = await syncGuildLadderScore({
          ladderScore: activeOverall,
          displayName: identity?.displayName,
          avatarUrl: identity?.avatarUrl,
          isAnonymous: profile?.isAnonymousInLadder === true,
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
          // Soft-skip (no-guild / not-member) is not a successful "local privacy" path.
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
      return;
    }

    // Global public ladder path (unchanged batch contract).
    if (activeTargets.length === 0 || activeGate !== 'ok') return;

    const snap = readEntitlementSnapshot();

    setBusy(true);
    try {
      const ladderProfile = buildLeaderboardProfileProjection(loadPhysicalProfile()) ?? undefined;
      const identity = getLadderUploadIdentity();
      // WHY: Hard gate — assessment sync UI must open identity sheet first; never upload as Pilot.
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
    syncPage,
    busy,
    summary,
    failures,
    gate,
    targetCount: targets.length,
    overallScore,
    goJoinArena,
    clearFeedback,
    wantsGlobalLadder,
    setWantsGlobalLadder,
    hasGuild,
    publishMode,
    lastCloudOutcome,
  };
}
