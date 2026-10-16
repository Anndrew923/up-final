import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  buildLeaderboardSyncTargets,
  createEmptyLeaderboardSyncRunSummary,
  type LadderSyncShardFailure,
  type LeaderboardSyncRunSummary,
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
import { readEntitlementSnapshot } from '../stores/entitlementSelectors';
import { sanitizeGuildRadarScores } from '../logic/core/guildRadarScores';
import { useMergedScoresFromLocalStores } from './useMergedScoresFromLocalStores';
import { resolveLeaderboardUploadGate } from './useLeaderboardUpload';

export type LeaderboardSyncAllSummary = LeaderboardSyncRunSummary;

export interface UseLeaderboardSyncAllOptions {
  onFinished?: () => void;
}

/**
 * Intent-driven Sync All — `syncGlobal` (Pro shards + fan-out) vs `syncGuildOnly` (club roster).
 * WHY: Button = intent; never a sticky publish preference.
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

  const uid = useAuthStore((s) => s.uid);
  const authStatus = useAuthStore((s) => s.status);
  const isAnonymous = useAuthStore((s) => s.isAnonymous);

  /** null = binding loading — UI must not flash dual capsules. */
  const [hasGuild, setHasGuild] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!uid || isAnonymous) {
      setHasGuild(false);
      return;
    }
    setHasGuild(null);
    void fetchUserGuildBinding(uid).then((binding) => {
      if (!cancelled) setHasGuild(Boolean(binding?.guildId));
    });
    return () => {
      cancelled = true;
    };
  }, [uid, isAnonymous]);

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

  useEffect(() => {
    if (!uid || isAnonymous) {
      setFullSyncBlock(null);
      return;
    }
    refreshFullSyncBlock(uid);
  }, [uid, isAnonymous, refreshFullSyncBlock]);

  const goJoinArena = useCallback(() => {
    navigate(joinArenaPath('ladder'));
  }, [navigate]);

  const syncGuildOnly = useCallback(async () => {
    setSummaryState(null);
    const user = getCurrentFirebaseUser();
    if (!user || user.isAnonymous) return;

    const fullSyncGate = checkFullSyncAllowed(user.uid);
    if (!fullSyncGate.allowed) {
      setFullSyncBlock(fullSyncGate);
      return;
    }

    setBusy(true);
    try {
      const binding = await fetchUserGuildBinding(user.uid);
      if (!binding?.guildId || !(overallScore > 0)) {
        const empty = createEmptyLeaderboardSyncRunSummary();
        setSummaryState({ signature: targetsSignature, summary: empty, failures: [] });
        onFinishedRef.current?.();
        return;
      }
      const identity = getLadderUploadIdentity();
      const profile = buildLeaderboardProfileProjection(loadPhysicalProfile());
      const radarScores = sanitizeGuildRadarScores(merged);
      const result = await syncGuildLadderScore({
        ladderScore: overallScore,
        displayName: identity?.displayName,
        avatarUrl: identity?.avatarUrl,
        isAnonymous: profile?.isAnonymousInLadder === true,
        ...(radarScores ? { radarScores } : {}),
      });
      if (result.ok && !result.skipped) {
        recordFullSyncAllowed(user.uid);
        refreshFullSyncBlock(user.uid);
        invalidateGuildLadderCache(result.guildId ?? undefined);
        const tally = createEmptyLeaderboardSyncRunSummary();
        tally.attempted = 1;
        tally.updated = 1;
        setSummaryState({ signature: targetsSignature, summary: tally, failures: [] });
        void hapticService.trigger('success');
      } else if (!result.ok) {
        setSummaryState({
          signature: targetsSignature,
          summary: createEmptyLeaderboardSyncRunSummary(),
          failures: [{ metric: 'ladderScore', reason: result.reason }],
        });
      } else {
        setSummaryState({
          signature: targetsSignature,
          summary: createEmptyLeaderboardSyncRunSummary(),
          failures: [],
        });
      }
      onFinishedRef.current?.();
    } finally {
      setBusy(false);
    }
  }, [merged, overallScore, refreshFullSyncBlock, targetsSignature]);

  const syncGlobal = useCallback(async () => {
    setSummaryState(null);
    const user = getCurrentFirebaseUser();
    if (!user || user.isAnonymous) return;
    if (targets.length === 0 || gate !== 'ok') return;

    const fullSyncGate = checkFullSyncAllowed(user.uid);
    if (!fullSyncGate.allowed) {
      setFullSyncBlock(fullSyncGate);
      return;
    }

    const snap = readEntitlementSnapshot();
    setBusy(true);
    try {
      const ladderProfile = buildLeaderboardProfileProjection(loadPhysicalProfile()) ?? undefined;
      const identity = getLadderUploadIdentity();
      if (!identity) return;

      const batch = await runLeaderboardBatchUpload({
        targets,
        uid: user.uid,
        displayName: identity.displayName,
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
    syncGlobal,
    syncGuildOnly,
    busy,
    summary,
    failures,
    fullSyncBlock,
    gate,
    targetCount: targets.length,
    hasGuild,
    goJoinArena,
    clearFeedback,
  };
}
