import type { LocalHistoryRecord } from './localHistoryRecord';
import type { ScoreMetric } from '../../types/scoring';

export const FOOTPRINT_SCHEMA_VERSION = 1;
export const WEEKLY_RHYTHM_TARGET = 3;
/** Heatmap window — lifetimeDays stays monotonic when older keys are pruned. */
export const FOOTPRINT_RETENTION_MONTHS = 18;

export type FootprintLevel = 1 | 2 | 3;

/** Core 3×3 attendance / six-axis catalog. */
export const CORE_SPEC_BADGE_IDS = [
  'IGN-01',
  'ARC-01',
  'RHY-03',
  'RUN-07',
  'RUN-30',
  'CRS-04',
  'HIST-10',
  'PR-01',
  'SPEC-6',
] as const;

/** Optional specialty catalog (arm / 5 km / 100 m). */
export const OPTIONAL_SPEC_BADGE_IDS = ['ARM-01', '5K-01', 'SPR-01', 'SOM-01'] as const;

/** Catalog IDs persisted on the footprint blob so 18-month prune cannot relock. */
export const TRAINING_FOOTPRINT_BADGE_IDS = [
  ...CORE_SPEC_BADGE_IDS,
  ...OPTIONAL_SPEC_BADGE_IDS,
] as const;

export type CoreSpecBadgeId = (typeof CORE_SPEC_BADGE_IDS)[number];
export type OptionalSpecBadgeId = (typeof OPTIONAL_SPEC_BADGE_IDS)[number];
export type TrainingFootprintBadgeId = (typeof TRAINING_FOOTPRINT_BADGE_IDS)[number];

export function isOptionalSpecBadgeId(id: string): id is OptionalSpecBadgeId {
  return (OPTIONAL_SPEC_BADGE_IDS as readonly string[]).includes(id);
}

export interface TrainingFootprintState {
  schemaVersion: typeof FOOTPRINT_SCHEMA_VERSION;
  /** Device-local calendar days → highest action level that day. */
  days: Record<string, FootprintLevel>;
  lifetimeDays: number;
  /** Monotonic union of unlocked spec-badge IDs (never shrinks on prune). */
  unlockedBadgeIds: TrainingFootprintBadgeId[];
}

export function emptyTrainingFootprint(): TrainingFootprintState {
  return {
    schemaVersion: FOOTPRINT_SCHEMA_VERSION,
    days: {},
    lifetimeDays: 0,
    unlockedBadgeIds: [],
  };
}

export const EMPTY_TRAINING_FOOTPRINT: TrainingFootprintState = emptyTrainingFootprint();

const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isFootprintLevel(value: unknown): value is FootprintLevel {
  return value === 1 || value === 2 || value === 3;
}

/**
 * Device-local calendar day. Do not use UTC ISO slice — evening in UTC+8 would roll forward.
 */
export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDateKey(key: string): Date | null {
  const match = DATE_KEY_RE.exec(key);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

/** Monday-start local week (Mon=0 … Sun=6). */
export function startOfLocalIsoWeek(date: Date): Date {
  const day = date.getDay();
  const offset = day === 0 ? 6 : day - 1;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - offset);
}

export function mergeFootprintLevel(
  existing: FootprintLevel | undefined,
  incoming: FootprintLevel
): { next: FootprintLevel; changed: boolean } {
  if (existing == null) return { next: incoming, changed: true };
  if (incoming > existing) return { next: incoming, changed: true };
  return { next: existing, changed: false };
}

function pruneDaysMap(
  days: Record<string, FootprintLevel>,
  now: Date
): Record<string, FootprintLevel> {
  const cutoff = new Date(now.getFullYear(), now.getMonth() - FOOTPRINT_RETENTION_MONTHS, now.getDate());
  const cutoffKey = localDateKey(cutoff);
  const next: Record<string, FootprintLevel> = {};
  for (const [key, level] of Object.entries(days)) {
    if (!isFootprintLevel(level) || !parseLocalDateKey(key)) continue;
    if (key >= cutoffKey) next[key] = level;
  }
  return next;
}

export function applyFootprintRecord(
  state: TrainingFootprintState,
  dayKey: string,
  incoming: FootprintLevel,
  now: Date = new Date()
): { state: TrainingFootprintState; changed: boolean } {
  if (!parseLocalDateKey(dayKey) || !isFootprintLevel(incoming)) {
    return { state, changed: false };
  }

  const merged = mergeFootprintLevel(state.days[dayKey], incoming);
  if (!merged.changed) {
    return { state, changed: false };
  }

  const wasNewDay = state.days[dayKey] == null;
  const days = pruneDaysMap({ ...state.days, [dayKey]: merged.next }, now);
  return {
    changed: true,
    state: {
      schemaVersion: FOOTPRINT_SCHEMA_VERSION,
      days,
      lifetimeDays: wasNewDay ? state.lifetimeDays + 1 : state.lifetimeDays,
      unlockedBadgeIds: parseUnlockedBadgeIds(state.unlockedBadgeIds),
    },
  };
}

export function countActiveDaysInLocalWeek(
  days: Record<string, FootprintLevel>,
  now: Date = new Date()
): number {
  const weekStart = startOfLocalIsoWeek(now);
  const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
  const startKey = localDateKey(weekStart);
  const endKey = localDateKey(weekEnd);
  let count = 0;
  for (const key of Object.keys(days)) {
    if (key >= startKey && key <= endKey) count += 1;
  }
  return count;
}

export function historicalMaxForMetric(
  metric: ScoreMetric,
  historyRecords: readonly LocalHistoryRecord[]
): number | null {
  let max: number | null = null;
  for (const row of historyRecords) {
    const value = row.scores[metric];
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    if (max == null || value > max) max = value;
  }
  return max;
}

/**
 * First finite score is not a PR — there is no prior mark to beat.
 * Compares against history-axis max and the live store value before this write.
 */
export function isPersonalRecord(
  metric: ScoreMetric,
  nextScore: number,
  priorLiveScore: number | undefined,
  historyRecords: readonly LocalHistoryRecord[]
): boolean {
  if (!Number.isFinite(nextScore)) return false;
  const priors: number[] = [];
  const historyMax = historicalMaxForMetric(metric, historyRecords);
  if (historyMax != null) priors.push(historyMax);
  if (typeof priorLiveScore === 'number' && Number.isFinite(priorLiveScore)) {
    priors.push(priorLiveScore);
  }
  if (priors.length === 0) return false;
  return nextScore > Math.max(...priors);
}

export function resolveAssessmentFootprintLevel(
  metric: ScoreMetric,
  nextScore: number,
  priorLiveScore: number | undefined,
  historyRecords: readonly LocalHistoryRecord[]
): FootprintLevel {
  return isPersonalRecord(metric, nextScore, priorLiveScore, historyRecords) ? 3 : 2;
}

export interface MonthDotCell {
  dateKey: string | null;
  dayOfMonth: number | null;
  level: FootprintLevel | 0;
}

/** Monday-first 7-column month grid (leading/trailing pads are empty). */
export function buildMonthDotMatrix(
  days: Record<string, FootprintLevel>,
  now: Date = new Date()
): MonthDotCell[] {
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (first.getDay() + 6) % 7;
  const cells: MonthDotCell[] = [];

  for (let i = 0; i < leading; i += 1) {
    cells.push({ dateKey: null, dayOfMonth: null, level: 0 });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = localDateKey(new Date(year, month, day));
    const level = days[dateKey];
    cells.push({
      dateKey,
      dayOfMonth: day,
      level: isFootprintLevel(level) ? level : 0,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ dateKey: null, dayOfMonth: null, level: 0 });
  }

  return cells;
}

export function parseTrainingFootprintState(raw: unknown): TrainingFootprintState {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return emptyTrainingFootprint();
  }
  const row = raw as Partial<TrainingFootprintState>;
  const days: Record<string, FootprintLevel> = {};
  if (row.days && typeof row.days === 'object' && !Array.isArray(row.days)) {
    for (const [key, value] of Object.entries(row.days)) {
      if (parseLocalDateKey(key) && isFootprintLevel(value)) days[key] = value;
    }
  }
  const storedLifetime = Number(row.lifetimeDays);
  const lifetimeDays = Math.max(
    Object.keys(days).length,
    Number.isFinite(storedLifetime) ? Math.max(0, Math.floor(storedLifetime)) : 0
  );
  return {
    schemaVersion: FOOTPRINT_SCHEMA_VERSION,
    days,
    lifetimeDays,
    unlockedBadgeIds: parseUnlockedBadgeIds(row.unlockedBadgeIds),
  };
}

export function isTrainingFootprintBadgeId(value: unknown): value is TrainingFootprintBadgeId {
  return (
    typeof value === 'string' &&
    (TRAINING_FOOTPRINT_BADGE_IDS as readonly string[]).includes(value)
  );
}

export function parseUnlockedBadgeIds(raw: unknown): TrainingFootprintBadgeId[] {
  if (!Array.isArray(raw)) return [];
  const present = new Set(raw.filter(isTrainingFootprintBadgeId));
  return TRAINING_FOOTPRINT_BADGE_IDS.filter((id) => present.has(id));
}

/**
 * Monotonic union for Pro backup/restore.
 * WHY: Profile sync is otherwise last-write-wins; empty new-phone local must not erase cloud assets.
 * IMPACT: Dual-device disjoint days can under-count lifetime (max, not unique-key union across pruned history).
 */
export function mergeTrainingFootprintStates(
  a?: TrainingFootprintState | null,
  b?: TrainingFootprintState | null,
  now: Date = new Date()
): TrainingFootprintState {
  const left = parseTrainingFootprintState(a);
  const right = parseTrainingFootprintState(b);
  const days: Record<string, FootprintLevel> = { ...left.days };
  for (const [key, level] of Object.entries(right.days)) {
    days[key] = mergeFootprintLevel(days[key], level).next;
  }
  const pruned = pruneDaysMap(days, now);
  return {
    schemaVersion: FOOTPRINT_SCHEMA_VERSION,
    days: pruned,
    lifetimeDays: Math.max(left.lifetimeDays, right.lifetimeDays, Object.keys(pruned).length),
    unlockedBadgeIds: parseUnlockedBadgeIds([...left.unlockedBadgeIds, ...right.unlockedBadgeIds]),
  };
}

/**
 * Union-only write. Pruned heatmaps must not drop IDs that already unlocked.
 */
export function applyUnlockedBadgeUnion(
  state: TrainingFootprintState,
  newlyUnlocked: readonly string[]
): { state: TrainingFootprintState; changed: boolean } {
  const existing = parseUnlockedBadgeIds(state.unlockedBadgeIds);
  const merged = parseUnlockedBadgeIds([...existing, ...newlyUnlocked]);
  const sameSet =
    merged.length === existing.length && merged.every((id) => existing.includes(id));
  if (sameSet) {
    return { state, changed: false };
  }
  return {
    changed: true,
    state: {
      ...state,
      schemaVersion: FOOTPRINT_SCHEMA_VERSION,
      unlockedBadgeIds: merged,
    },
  };
}

export interface TrainingFootprintDashboardView {
  weeklyCount: number;
  weeklyTarget: number;
  lifetimeDays: number;
  monthCells: MonthDotCell[];
}

export function deriveFootprintDashboard(
  state: TrainingFootprintState,
  now: Date = new Date()
): TrainingFootprintDashboardView {
  return {
    weeklyCount: countActiveDaysInLocalWeek(state.days, now),
    weeklyTarget: WEEKLY_RHYTHM_TARGET,
    lifetimeDays: state.lifetimeDays,
    monthCells: buildMonthDotMatrix(state.days, now),
  };
}
