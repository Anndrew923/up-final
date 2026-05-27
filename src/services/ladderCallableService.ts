import { httpsCallable, type HttpsCallable } from 'firebase/functions';
import type { LeaderboardShardId } from '../logic/core/ladderShards';
import type { LeaderboardSyncRunSummary } from '../logic/core/leaderboardSyncTargets';
import type { LadderProfileProjection } from '../types/ladderProfile';
import type { ScoreMap } from '../types/scoring';
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
};

type LadderSyncBatchResponse = {
  ok: boolean;
  reason?: string;
  nextAllowedAt?: string;
  summary?: LeaderboardSyncRunSummary;
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

export async function callLadderSubmitShard(params: {
  input: SubmitLeaderboardInput;
  options?: SubmitLeaderboardOptions;
}): Promise<SubmitLeaderboardResult | null> {
  const callable = getSubmitShardCallable();
  if (!callable) return null;

  const { input, options } = params;
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
}

export async function callLadderSyncPreview(params: {
  displayName: string;
  mergedScores: ScoreMap;
  avatarUrl?: string | null;
  profile?: Partial<LadderProfileProjection>;
}): Promise<{ ok: boolean; reason?: 'pro-required' | 'invalid-input' | 'unknown' } | null> {
  const callable = getSyncPreviewCallable();
  if (!callable) return null;

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
}

export async function callLadderSyncBatch(params: {
  targets: { metric: LeaderboardShardId; score: number }[];
  displayName: string;
  avatarUrl?: string | null;
  profile?: Partial<LadderProfileProjection>;
  fullSync?: boolean;
  preview?: { mergedScores: ScoreMap };
}): Promise<
  | { ok: true; summary: LeaderboardSyncRunSummary }
  | { ok: false; reason: string; nextAllowedAt?: string }
  | null
> {
  const callable = getSyncBatchCallable();
  if (!callable) return null;

  const { data } = await callable({
    targets: params.targets,
    displayName: params.displayName,
    avatarUrl: params.avatarUrl ?? undefined,
    profile: params.profile,
    fullSync: params.fullSync,
    preview: params.preview,
  });

  if (!data?.ok) {
    return {
      ok: false,
      reason: data.reason ?? 'unknown',
      nextAllowedAt: data.nextAllowedAt,
    };
  }

  const summary = data.summary ?? {
    attempted: 0,
    updated: 0,
    unchanged: 0,
    errors: 0,
    rateLimited: 0,
    proRequired: 0,
  };
  return { ok: true, summary };
}
