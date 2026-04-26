import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  buildLeaderboardSyncTargets,
  mergeLeaderboardSyncTargetsWithSupplemental,
  pickLeaderboardSyncTargetsForAssessmentScope,
  type AssessmentLadderSyncScope,
  type LeaderboardSyncRunSummary,
  type LeaderboardSyncTarget,
} from '../logic/core/leaderboardSyncTargets';
import { calculateSixAxisOverall } from '../logic/core/scoring';
import { ROUTES } from '../config/routes';
import { getCurrentFirebaseUser } from '../services/firebaseClient';
import { runLeaderboardBatchUpload } from '../services/leaderboardBatchUploadService';
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

  const supplementalKey = useMemo(() => {
    const s = options.supplementalTargets;
    if (!s?.length) return '';
    return s.map((t) => `${t.metric}:${t.score}`).join('|');
  }, [options.supplementalTargets]);

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
  }, [merged, overallScore, options.scope, supplementalKey]);

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
  const [summary, setSummary] = useState<LeaderboardSyncRunSummary | null>(null);

  const clearFeedback = useCallback(() => setSummary(null), []);

  useEffect(() => {
    clearFeedback();
  }, [targetsSignature, clearFeedback]);

  const goJoinArena = useCallback(() => {
    navigate(ROUTES.joinArena);
  }, [navigate]);

  const syncPage = useCallback(async () => {
    setSummary(null);
    if (targets.length === 0 || gate !== 'ok') return;

    const user = getCurrentFirebaseUser();
    if (!user || user.isAnonymous) return;

    const displayName = useAuthStore.getState().displayName?.trim() || 'Pilot';
    const snap = buildEntitlementSnapshot();

    setBusy(true);
    try {
      const tally = await runLeaderboardBatchUpload({
        targets,
        uid: user.uid,
        displayName,
        entitlement: snap,
      });
      setSummary(tally);
      onFinishedRef.current?.();
    } finally {
      setBusy(false);
    }
  }, [targets, gate]);

  return {
    syncPage,
    busy,
    summary,
    gate,
    targetCount: targets.length,
    goJoinArena,
    clearFeedback,
  };
}
