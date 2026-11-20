/**
 * Log self-comparison evolution report (pure).
 *
 * WHY: LOGS dual-radar and share cards need one deterministic baseline/current/
 * delta projection — no UI or SDK — so Day-1 identity, PR badges, and axis Δ
 * cannot drift between the on-screen card and the offscreen PNG.
 */
import type { ScoreMap, SixAxisMetric } from '../../types/scoring';
import { SIX_AXIS_METRICS } from '../../types/scoring';
import type { LocalHistoryRecord } from './localHistoryRecord';
import { isPersonalRecord } from './trainingFootprint';

export type LogEvolutionMode = 'baseline_ready' | 'comparing';

export interface LogEvolutionAxisDelta {
  axis: SixAxisMetric;
  from: number;
  to: number;
  delta: number;
  /** Current (latest) value is a personal best vs earlier archive rows. */
  isPersonalBest: boolean;
}

export interface LogEvolutionRecordBadge {
  id: string;
  isDay1Baseline: boolean;
  isPersonalBest: boolean;
}

export interface LogEvolutionReport {
  mode: LogEvolutionMode;
  /** Earliest valid archive id (stable Day-1 identity). */
  day1BaselineId: string | null;
  /** Resolved baseline after optional selection + safe fallback. */
  selectedBaselineId: string | null;
  /** Immediate predecessor of the newest log (null when fewer than 2 rows). */
  previousLogId: string | null;
  current: LocalHistoryRecord | null;
  baseline: LocalHistoryRecord | null;
  deltas: LogEvolutionAxisDelta[];
  overallDelta: number | null;
  badges: LogEvolutionRecordBadge[];
}

export interface BuildLogEvolutionReportOptions {
  /** Preferred baseline id; invalid / deleted → falls back to Day 1. */
  selectedBaselineId?: string | null;
}

const round2 = (value: number): number => Math.round(value * 100) / 100;

function createdAtMs(iso: string): number {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : 0;
}

/**
 * Ascending createdAt with id tie-break — defends against store prepend order
 * or caller-supplied shuffled arrays so Day 1 never flips under reordering.
 */
export function sortHistoryAscending(
  records: readonly LocalHistoryRecord[]
): LocalHistoryRecord[] {
  return [...records].sort((a, b) => {
    const diff = createdAtMs(a.createdAt) - createdAtMs(b.createdAt);
    if (diff !== 0) return diff;
    return a.id.localeCompare(b.id);
  });
}

function finiteAxisScore(scores: ScoreMap, axis: SixAxisMetric): number | null {
  const value = scores[axis];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function buildAxisDeltas(
  baseline: LocalHistoryRecord,
  current: LocalHistoryRecord,
  historyBeforeCurrent: readonly LocalHistoryRecord[]
): LogEvolutionAxisDelta[] {
  const deltas: LogEvolutionAxisDelta[] = [];
  for (const axis of SIX_AXIS_METRICS) {
    const from = finiteAxisScore(baseline.scores, axis);
    const to = finiteAxisScore(current.scores, axis);
    // WHY: Skip incomplete spokes — never emit NaN that would poison UI / canvas.
    if (from == null || to == null) continue;
    deltas.push({
      axis,
      from: round2(from),
      to: round2(to),
      delta: round2(to - from),
      isPersonalBest: isPersonalRecord(axis, to, undefined, historyBeforeCurrent),
    });
  }
  return deltas;
}

function isRecordPersonalBest(
  record: LocalHistoryRecord,
  priors: readonly LocalHistoryRecord[]
): boolean {
  if (priors.length === 0) return false;

  const priorOverall = priors
    .map((row) => row.overallScore)
    .filter((score) => typeof score === 'number' && Number.isFinite(score));
  if (priorOverall.length > 0 && record.overallScore > Math.max(...priorOverall)) {
    return true;
  }

  for (const axis of SIX_AXIS_METRICS) {
    const score = finiteAxisScore(record.scores, axis);
    if (score == null) continue;
    if (isPersonalRecord(axis, score, undefined, priors)) return true;
  }
  return false;
}

function buildBadges(sortedAsc: readonly LocalHistoryRecord[]): LogEvolutionRecordBadge[] {
  const day1Id = sortedAsc[0]?.id ?? null;
  return sortedAsc.map((row, index) => {
    const priors = sortedAsc.slice(0, index);
    return {
      id: row.id,
      isDay1Baseline: day1Id != null && row.id === day1Id,
      isPersonalBest: isRecordPersonalBest(row, priors),
    };
  });
}

function emptyReport(): LogEvolutionReport {
  return {
    mode: 'baseline_ready',
    day1BaselineId: null,
    selectedBaselineId: null,
    previousLogId: null,
    current: null,
    baseline: null,
    deltas: [],
    overallDelta: null,
    badges: [],
  };
}

/**
 * Derive Day-1 / selected baseline vs newest log deltas + per-row badges.
 */
export function buildLogEvolutionReport(
  records: readonly LocalHistoryRecord[],
  options: BuildLogEvolutionReportOptions = {}
): LogEvolutionReport {
  if (!records || records.length === 0) return emptyReport();

  const sortedAsc = sortHistoryAscending(records);
  const day1 = sortedAsc[0] ?? null;
  const day1BaselineId = day1?.id ?? null;
  const current = sortedAsc[sortedAsc.length - 1] ?? null;
  const previous = sortedAsc.length >= 2 ? (sortedAsc[sortedAsc.length - 2] ?? null) : null;
  const previousLogId = previous?.id ?? null;
  const badges = buildBadges(sortedAsc);

  const requestedId = options.selectedBaselineId?.trim() || null;
  const requested =
    requestedId != null ? (sortedAsc.find((row) => row.id === requestedId) ?? null) : null;
  const baseline = requested ?? day1;
  const selectedBaselineId = baseline?.id ?? null;

  if (!current || !baseline || sortedAsc.length < 2 || baseline.id === current.id) {
    return {
      mode: 'baseline_ready',
      day1BaselineId,
      selectedBaselineId,
      previousLogId,
      current,
      baseline,
      deltas: [],
      overallDelta: null,
      badges,
    };
  }

  const historyBeforeCurrent = sortedAsc.slice(0, sortedAsc.length - 1);
  const deltas = buildAxisDeltas(baseline, current, historyBeforeCurrent);
  const overallDelta = round2(current.overallScore - baseline.overallScore);

  return {
    mode: 'comparing',
    day1BaselineId,
    selectedBaselineId,
    previousLogId,
    current,
    baseline,
    deltas,
    overallDelta,
    badges,
  };
}

/** Lookup helper for list cards — O(n) once per report. */
export function badgeMapFromReport(
  report: LogEvolutionReport
): ReadonlyMap<string, LogEvolutionRecordBadge> {
  return new Map(report.badges.map((badge) => [badge.id, badge]));
}
