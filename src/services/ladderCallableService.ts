import { httpsCallable, type HttpsCallable } from 'firebase/functions';
import type { LeaderboardShardId } from '../logic/core/ladderShards';
import type {
  LadderSyncShardFailure,
  LeaderboardSyncRunSummary,
} from '../logic/core/leaderboardSyncTargets';
import { createEmptyLeaderboardSyncRunSummary } from '../logic/core/leaderboardSyncTargets';
import type { LadderProfileProjection } from '../types/ladderProfile';
import type { ScoreMap } from '../types/scoring';
import { logLadderCallableError } from '../lib/ladderCallableDevLog';
import { getFirebaseFunctions } from './firebaseClient';
import type {
  SubmitLeaderboardInput,
  SubmitLeaderboardOptions,
  SubmitLeaderboardResult,
} from './leaderboardService';

type LadderSubmitShardPayload = {
  metric: LeaderboardShardId;
  score: number;
  displayName: string;
  avatarUrl?: string;
  profile?: Partial<LadderProfileProjection>;
  skipPreviewUpdate?: boolean;
  skipOverallPreviewSync?: boolean;
};

type LadderSyncPreviewPayload = {
  displayName: string;
  mergedScores: ScoreMap;
  avatarUrl?: string | null;
  profile?: Partial<LadderProfileProjection>;
};

type LadderSyncBatchPayload = {
  targets: { metric: LeaderboardShardId; score: number }[];
  displayName: string;
  avatarUrl?: string | null;
  profile?: Partial<LadderProfileProjection>;
  fullSync?: boolean;
  preview?: { mergedScores: ScoreMap };
  /** Extra entry shards to receive https avatar without a score change (default: ladderScore). */
  propagateAvatarShards?: LeaderboardShardId[];
};

type LadderSyncBatchResponse = {
  ok: boolean;
  reason?: string;
  nextAllowedAt?: string;
  summary?: LeaderboardSyncRunSummary;
  failures?: LadderSyncShardFailure[];
};

export type LadderSyncBatchSuccess = {
  ok: true;
  summary: LeaderboardSyncRunSummary;
  failures: LadderSyncShardFailure[];
};

let submitShardFn: HttpsCallable<LadderSubmitShardPayload, SubmitLeaderboardResult> | null =
  null;
let syncPreviewFn: HttpsCallable<
  LadderSyncPreviewPayload,
  { ok: boolean; reason?: string }
> | null = null;
let syncBatchFn: HttpsCallable<LadderSyncBatchPayload, LadderSyncBatchResponse> | null = null;

function getSubmitShardCallable() {
  const functions = getFirebaseFunctions();
  if (!functions) return null;
  if (!submitShardFn) {
    submitShardFn = httpsCallable<LadderSubmitShardPayload, SubmitLeaderboardResult>(
      functions,
      'ladderSubmitShard'
    );
  }
  return submitShardFn;
}

function getSyncPreviewCallable() {
  const functions = getFirebaseFunctions();
  if (!functions) return null;
  if (!syncPreviewFn) {
    syncPreviewFn = httpsCallable(functions, 'ladderSyncPreview');
  }
  return syncPreviewFn;
}

function getSyncBatchCallable() {
  const functions = getFirebaseFunctions();
  if (!functions) return null;
  if (!syncBatchFn) {
    syncBatchFn = httpsCallable(functions, 'ladderSyncBatch');
  }
  return syncBatchFn;
}

function normalizeBatchSummary(raw: LeaderboardSyncRunSummary | undefined): LeaderboardSyncRunSummary {
  const base = raw ?? createEmptyLeaderboardSyncRunSummary();
  return {
    ...createEmptyLeaderboardSyncRunSummary(),
    ...base,
    invalidInput: base.invalidInput ?? 0,
    internal: base.internal ?? 0,
    avatarPatched: base.avatarPatched ?? 0,
    errors: base.errors ?? (base.invalidInput ?? 0) + (base.internal ?? 0),
  };
}

export async function callLadderSubmitShard(params: {
  input: SubmitLeaderboardInput;
  options?: SubmitLeaderboardOptions;
}): Promise<SubmitLeaderboardResult | null> {
  const callable = getSubmitShardCallable();
  if (!callable) return null;

  const { input, options } = params;
  try {
    const { data } = await callable({
      metric: input.metric,
      score: input.score,
      displayName: input.displayName,
      avatarUrl: input.avatarUrl,
      profile: input.profile,
      skipPreviewUpdate: options?.skipPreviewUpdate,
      skipOverallPreviewSync: options?.skipOverallPreviewSync,
    });
    return data;
  } catch (err) {
    logLadderCallableError('ladderSubmitShard', err);
    throw err;
  }
}

export async function callLadderSyncPreview(params: {
  displayName: string;
  mergedScores: ScoreMap;
  avatarUrl?: string | null;
  profile?: Partial<LadderProfileProjection>;
}): Promise<{ ok: boolean; reason?: 'pro-required' | 'invalid-input' | 'unknown' } | null> {
  const callable = getSyncPreviewCallable();
  if (!callable) return null;

  try {
    const { data } = await callable({
      displayName: params.displayName,
      mergedScores: params.mergedScores,
      avatarUrl: params.avatarUrl ?? undefined,
      profile: params.profile,
    });
    if (!data?.ok) {
      if (data?.reason === 'pro-required') return { ok: false, reason: 'pro-required' };
      return { ok: false, reason: 'unknown' };
    }
    return { ok: true };
  } catch (err) {
    logLadderCallableError('ladderSyncPreview', err);
    throw err;
  }
}

export async function callLadderSyncBatch(params: {
  targets: { metric: LeaderboardShardId; score: number }[];
  displayName: string;
  avatarUrl?: string | null;
  profile?: Partial<LadderProfileProjection>;
  fullSync?: boolean;
  preview?: { mergedScores: ScoreMap };
  propagateAvatarShards?: LeaderboardShardId[];
}): Promise<
  | LadderSyncBatchSuccess
  | { ok: false; reason: string; nextAllowedAt?: string; failures: LadderSyncShardFailure[] }
  | null
> {
  const callable = getSyncBatchCallable();
  if (!callable) return null;

  try {
    const { data } = await callable({
      targets: params.targets,
      displayName: params.displayName,
      avatarUrl: params.avatarUrl ?? undefined,
      profile: params.profile,
      fullSync: params.fullSync,
      preview: params.preview,
      propagateAvatarShards: params.propagateAvatarShards,
    });

    const failures = Array.isArray(data?.failures) ? data.failures : [];

    if (!data?.ok) {
      return {
        ok: false,
        reason: data.reason ?? 'unknown',
        nextAllowedAt: data.nextAllowedAt,
        failures,
      };
    }

    const summary = normalizeBatchSummary(data.summary);

    if (import.meta.env.DEV && failures.length > 0) {
      console.warn('[ladder] ladderSyncBatch shard failures', failures);
    }

    return { ok: true, summary, failures };
  } catch (err) {
    logLadderCallableError('ladderSyncBatch', err);
    throw err;
  }
}
