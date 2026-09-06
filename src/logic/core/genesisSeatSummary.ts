/**
 * Genesis seat FOMO summary — client parse / TTL / fallback.
 * WHY: Server writes staged fields only (no bare claimedCount); client must degrade to
 * early static copy on any failure so ladder list loading never blocks.
 */

export type GenesisSeatStage = 'early' | 'growth' | 'closing' | 'ended';

export interface GenesisSeatPublicSummary {
  seatLimit: number;
  stage: GenesisSeatStage;
  /** Present only for `growth` — whole tens (10, 20, …). */
  percentBucket?: number;
  /** Present only for `closing` — seats left under the cap. */
  remaining?: number;
  updatedAt?: string;
}

/** Structured copy inputs — UI maps to a single i18n key family. */
export type GenesisSeatCopySpec =
  | { stage: 'early'; count: number }
  | { stage: 'growth'; percent: number }
  | { stage: 'closing'; remaining: number }
  | { stage: 'ended' };

/** Mirror Functions `GENESIS_EARLY_BIRD_SEAT_LIMIT_DEFAULT` for offline fallback. */
export const GENESIS_SEAT_SUMMARY_DEFAULT_LIMIT = 2000;

export const GENESIS_SEAT_SUMMARY_TTL_MS = {
  early: 30 * 60 * 1000,
  growth: 10 * 60 * 1000,
  closing: 90 * 1000,
  ended: 30 * 60 * 1000,
} as const;

/** Soft cache after network/parse failure — avoid 30m poison while still coalescing bursts. */
export const GENESIS_SEAT_SUMMARY_ERROR_RETRY_TTL_MS = 30 * 1000;

const STAGES = new Set<GenesisSeatStage>(['early', 'growth', 'closing', 'ended']);

export function buildGenesisSeatEarlyFallback(
  seatLimit: number = GENESIS_SEAT_SUMMARY_DEFAULT_LIMIT
): GenesisSeatPublicSummary {
  return {
    seatLimit: seatLimit >= 1 ? Math.floor(seatLimit) : GENESIS_SEAT_SUMMARY_DEFAULT_LIMIT,
    stage: 'early',
  };
}

export function buildGenesisSeatEndedSummary(
  seatLimit: number = GENESIS_SEAT_SUMMARY_DEFAULT_LIMIT
): GenesisSeatPublicSummary {
  return {
    seatLimit: seatLimit >= 1 ? Math.floor(seatLimit) : GENESIS_SEAT_SUMMARY_DEFAULT_LIMIT,
    stage: 'ended',
  };
}

export function ttlMsForGenesisSeatStage(stage: GenesisSeatStage): number {
  return GENESIS_SEAT_SUMMARY_TTL_MS[stage];
}

/**
 * Normalize Firestore `public_meta/genesisSeats` into a typed summary.
 * Rejects unknown shapes so the service can fall back to early.
 */
export function parseGenesisSeatPublicSummary(raw: unknown): GenesisSeatPublicSummary | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  const stage = data.stage;
  if (typeof stage !== 'string' || !STAGES.has(stage as GenesisSeatStage)) return null;

  const seatLimitRaw = Number(data.seatLimit);
  const seatLimit =
    Number.isFinite(seatLimitRaw) && seatLimitRaw >= 1
      ? Math.floor(seatLimitRaw)
      : GENESIS_SEAT_SUMMARY_DEFAULT_LIMIT;

  const updatedAt = typeof data.updatedAt === 'string' ? data.updatedAt : undefined;
  const summary: GenesisSeatPublicSummary = {
    seatLimit,
    stage: stage as GenesisSeatStage,
    updatedAt,
  };

  if (summary.stage === 'growth') {
    const bucket = Number(data.percentBucket);
    if (!Number.isFinite(bucket) || bucket < 10) return null;
    summary.percentBucket = Math.floor(bucket);
  }

  if (summary.stage === 'closing') {
    const remaining = Number(data.remaining);
    if (!Number.isFinite(remaining) || remaining < 0) return null;
    summary.remaining = Math.floor(remaining);
  }

  return summary;
}

/**
 * Pure copy contract for all genesis FOMO surfaces (ladder bar / modal / join arena).
 * WHY: Keep stage→params branching out of presentational components.
 */
export function resolveGenesisSeatCopySpec(
  summary: GenesisSeatPublicSummary
): GenesisSeatCopySpec {
  if (summary.stage === 'growth') {
    return { stage: 'growth', percent: summary.percentBucket ?? 10 };
  }
  if (summary.stage === 'closing') {
    return { stage: 'closing', remaining: summary.remaining ?? 0 };
  }
  if (summary.stage === 'ended') {
    return { stage: 'ended' };
  }
  return { stage: 'early', count: summary.seatLimit };
}
