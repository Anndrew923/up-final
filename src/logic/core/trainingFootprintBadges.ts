/**
 * Local spec-badge derivation. WHY: unlocks must stay device-local (no Firestore)
 * and monotonic — once an ID is on the footprint blob, heatmap prune cannot relock it.
 */
import { countCoreSixFilled } from './scoring';
import {
  TRAINING_FOOTPRINT_BADGE_IDS,
  WEEKLY_RHYTHM_TARGET,
  countActiveDaysInLocalWeek,
  startOfLocalIsoWeek,
  type TrainingFootprintBadgeId,
  type TrainingFootprintDashboardView,
  type TrainingFootprintState,
} from './trainingFootprint';
import { SIX_AXIS_COUNT, type ScoreMap } from '../../types/scoring';

export const BADGE_IGNITION_DAYS = 1;
export const BADGE_ARCHIVE_SNAPSHOTS = 1;
export const BADGE_RUN_IN_DAYS = 7;
export const BADGE_BREAKIN_DAYS = 30;
export const BADGE_CRUISE_WEEKS = 4;
export const BADGE_HISTORY_SNAPSHOTS = 10;
/** Safety cap so a corrupt days map cannot walk forever. */
const BADGE_CRUISE_SCAN_WEEKS = 200;

export interface SpecBadgeDeriveInput {
  scores: ScoreMap;
  historyLength: number;
}

export interface SpecBadgeView {
  id: TrainingFootprintBadgeId;
  unlocked: boolean;
  current: number;
  target: number;
}

export type TrainingFootprintPanelView = TrainingFootprintDashboardView & {
  badges: SpecBadgeView[];
};

function shiftLocalWeek(anchor: Date, weekDelta: number): Date {
  const start = startOfLocalIsoWeek(anchor);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + weekDelta * 7);
}

/**
 * Consecutive Mon–Sun weeks with ≥ target unique session days.
 * If the current week is not yet qualified, the streak starts at the previous week.
 */
export function countConsecutiveQualifiedWeeks(
  days: TrainingFootprintState['days'],
  now: Date = new Date(),
  target: number = WEEKLY_RHYTHM_TARGET
): number {
  const currentCount = countActiveDaysInLocalWeek(days, now);
  let cursor = currentCount >= target ? startOfLocalIsoWeek(now) : shiftLocalWeek(now, -1);
  let streak = 0;
  for (let i = 0; i < BADGE_CRUISE_SCAN_WEEKS; i += 1) {
    if (countActiveDaysInLocalWeek(days, cursor) < target) break;
    streak += 1;
    cursor = shiftLocalWeek(cursor, -1);
  }
  return streak;
}

function hasLevelThreeDay(days: TrainingFootprintState['days']): boolean {
  return Object.values(days).some((level) => level === 3);
}

function wasUnlocked(state: TrainingFootprintState, id: TrainingFootprintBadgeId): boolean {
  return (state.unlockedBadgeIds ?? []).includes(id);
}

export function deriveUnlockedBadges(
  state: TrainingFootprintState,
  input: SpecBadgeDeriveInput,
  now: Date = new Date()
): SpecBadgeView[] {
  const weeklyCount = countActiveDaysInLocalWeek(state.days, now);
  const cruiseStreak = countConsecutiveQualifiedWeeks(state.days, now);
  const sixFilled = countCoreSixFilled(input.scores);
  const historyLength = Math.max(0, input.historyLength);
  const live: Record<
    TrainingFootprintBadgeId,
    { current: number; target: number; liveUnlock: boolean }
  > = {
    'IGN-01': {
      current: Math.min(state.lifetimeDays, BADGE_IGNITION_DAYS),
      target: BADGE_IGNITION_DAYS,
      liveUnlock: state.lifetimeDays >= BADGE_IGNITION_DAYS,
    },
    'ARC-01': {
      current: Math.min(historyLength, BADGE_ARCHIVE_SNAPSHOTS),
      target: BADGE_ARCHIVE_SNAPSHOTS,
      liveUnlock: historyLength >= BADGE_ARCHIVE_SNAPSHOTS,
    },
    'RHY-03': {
      current: Math.min(weeklyCount, WEEKLY_RHYTHM_TARGET),
      target: WEEKLY_RHYTHM_TARGET,
      liveUnlock: weeklyCount >= WEEKLY_RHYTHM_TARGET,
    },
    'RUN-07': {
      current: Math.min(state.lifetimeDays, BADGE_RUN_IN_DAYS),
      target: BADGE_RUN_IN_DAYS,
      liveUnlock: state.lifetimeDays >= BADGE_RUN_IN_DAYS,
    },
    'RUN-30': {
      current: Math.min(state.lifetimeDays, BADGE_BREAKIN_DAYS),
      target: BADGE_BREAKIN_DAYS,
      liveUnlock: state.lifetimeDays >= BADGE_BREAKIN_DAYS,
    },
    'CRS-04': {
      current: Math.min(cruiseStreak, BADGE_CRUISE_WEEKS),
      target: BADGE_CRUISE_WEEKS,
      liveUnlock: cruiseStreak >= BADGE_CRUISE_WEEKS,
    },
    'HIST-10': {
      current: Math.min(historyLength, BADGE_HISTORY_SNAPSHOTS),
      target: BADGE_HISTORY_SNAPSHOTS,
      liveUnlock: historyLength >= BADGE_HISTORY_SNAPSHOTS,
    },
    'PR-01': {
      current: hasLevelThreeDay(state.days) || wasUnlocked(state, 'PR-01') ? 1 : 0,
      target: 1,
      liveUnlock: hasLevelThreeDay(state.days),
    },
    'SPEC-6': {
      current: Math.min(sixFilled, SIX_AXIS_COUNT),
      target: SIX_AXIS_COUNT,
      liveUnlock: sixFilled >= SIX_AXIS_COUNT,
    },
  };

  return TRAINING_FOOTPRINT_BADGE_IDS.map((id) => {
    const row = live[id];
    const unlocked = row.liveUnlock || wasUnlocked(state, id);
    return {
      id,
      unlocked,
      current: unlocked ? row.target : row.current,
      target: row.target,
    };
  });
}

export function unlockedBadgeIdsFromViews(
  views: readonly SpecBadgeView[]
): TrainingFootprintBadgeId[] {
  return views.filter((row) => row.unlocked).map((row) => row.id);
}
