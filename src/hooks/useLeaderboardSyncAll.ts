import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  buildLeaderboardSyncTargets,
  type LeaderboardSyncRunSummary,
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
  const [summary, setSummary] = useState<LeaderboardSyncRunSummary | null>(null);

  const clearFeedback = useCallback(() => setSummary(null), []);

  useEffect(() => {
    clearFeedback();
  }, [targetsSignature, clearFeedback]);

  const goJoinArena = useCallback(() => {
    navigate(ROUTES.joinArena);
  }, [navigate]);

  const syncAll = useCallback(async () => {
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
    syncAll,
    busy,
    summary,
    gate,
    targetCount: targets.length,
    goJoinArena,
    clearFeedback,
  };
}
