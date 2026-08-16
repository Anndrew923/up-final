import { describe, expect, it } from 'vitest';
import {
  applyUnlockedBadgeUnion,
  emptyTrainingFootprint,
  localDateKey,
  parseTrainingFootprintState,
  startOfLocalIsoWeek,
  type FootprintLevel,
  type TrainingFootprintState,
} from '../trainingFootprint';
import {
  BADGE_BREAKIN_DAYS,
  BADGE_CRUISE_WEEKS,
  BADGE_HISTORY_SNAPSHOTS,
  countConsecutiveQualifiedWeeks,
  deriveUnlockedBadges,
} from '../trainingFootprintBadges';
import type { ScoreMap } from '../../../types/scoring';

function footprint(
  partial: Partial<TrainingFootprintState> & Pick<TrainingFootprintState, 'days' | 'lifetimeDays'>
): TrainingFootprintState {
  return {
    schemaVersion: 1,
    unlockedBadgeIds: [],
    ...partial,
  };
}

function markWeekDays(
  monday: Date,
  count: number,
  days: Record<string, FootprintLevel>
): void {
  for (let i = 0; i < count; i += 1) {
    const day = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    days[localDateKey(day)] = 1;
  }
}

const NOW = new Date(2026, 7, 16);
const SIX_LIVE: ScoreMap = {
  strength: 10,
  explosivePower: 10,
  cardio: 10,
  muscleMass: 10,
  bodyFat: 10,
  gripStrength: 10,
};

describe('trainingFootprintBadges', () => {
  it('unlocks IGN-01 at lifetimeDays >= 1 and RUN-30 at 30', () => {
    const locked = deriveUnlockedBadges(footprint({ days: {}, lifetimeDays: 0 }), {
      scores: {},
      historyLength: 0,
    });
    expect(locked.find((row) => row.id === 'IGN-01')).toMatchObject({
      unlocked: false,
      current: 0,
      target: 1,
    });
    expect(locked.find((row) => row.id === 'RUN-30')).toMatchObject({
      unlocked: false,
      current: 0,
      target: BADGE_BREAKIN_DAYS,
    });

    const ignited = deriveUnlockedBadges(footprint({ days: { '2026-08-16': 1 }, lifetimeDays: 1 }), {
      scores: {},
      historyLength: 0,
    });
    expect(ignited.find((row) => row.id === 'IGN-01')?.unlocked).toBe(true);

    const run = deriveUnlockedBadges(footprint({ days: {}, lifetimeDays: BADGE_BREAKIN_DAYS }), {
      scores: {},
      historyLength: 0,
    });
    expect(run.find((row) => row.id === 'RUN-30')).toMatchObject({
      unlocked: true,
      current: BADGE_BREAKIN_DAYS,
    });
    expect(
      deriveUnlockedBadges(footprint({ days: {}, lifetimeDays: BADGE_BREAKIN_DAYS - 1 }), {
        scores: {},
        historyLength: 0,
      }).find((row) => row.id === 'RUN-30')?.unlocked
    ).toBe(false);
  });

  it('walks CRS-04 back from the previous week when the current week is short', () => {
    const days: Record<string, FootprintLevel> = { '2026-08-16': 1 };
    const currentMonday = startOfLocalIsoWeek(NOW);
    for (let week = 1; week <= BADGE_CRUISE_WEEKS; week += 1) {
      const monday = new Date(
        currentMonday.getFullYear(),
        currentMonday.getMonth(),
        currentMonday.getDate() - week * 7
      );
      markWeekDays(monday, 3, days);
    }
    expect(countConsecutiveQualifiedWeeks(days, NOW)).toBe(BADGE_CRUISE_WEEKS);
    const views = deriveUnlockedBadges(footprint({ days, lifetimeDays: 13 }), {
      scores: {},
      historyLength: 0,
    }, NOW);
    expect(views.find((row) => row.id === 'CRS-04')?.unlocked).toBe(true);
  });

  it('includes the current week in CRS-04 when it already qualifies', () => {
    const days: Record<string, FootprintLevel> = {};
    const currentMonday = startOfLocalIsoWeek(NOW);
    for (let week = 0; week < BADGE_CRUISE_WEEKS; week += 1) {
      const monday = new Date(
        currentMonday.getFullYear(),
        currentMonday.getMonth(),
        currentMonday.getDate() - week * 7
      );
      markWeekDays(monday, 3, days);
    }
    expect(countConsecutiveQualifiedWeeks(days, NOW)).toBe(BADGE_CRUISE_WEEKS);
  });

  it('does not unlock CRS-04 on a three-week cruise', () => {
    const days: Record<string, FootprintLevel> = {};
    const currentMonday = startOfLocalIsoWeek(NOW);
    for (let week = 0; week < BADGE_CRUISE_WEEKS - 1; week += 1) {
      const monday = new Date(
        currentMonday.getFullYear(),
        currentMonday.getMonth(),
        currentMonday.getDate() - week * 7
      );
      markWeekDays(monday, 3, days);
    }
    expect(countConsecutiveQualifiedWeeks(days, NOW)).toBe(BADGE_CRUISE_WEEKS - 1);
    expect(
      deriveUnlockedBadges(footprint({ days, lifetimeDays: 9 }), { scores: {}, historyLength: 0 }, NOW).find(
        (row) => row.id === 'CRS-04'
      )?.unlocked
    ).toBe(false);
  });

  it('unlocks HIST-10 at 10 snapshots, not 9', () => {
    const nine = deriveUnlockedBadges(emptyTrainingFootprint(), {
      scores: {},
      historyLength: BADGE_HISTORY_SNAPSHOTS - 1,
    });
    const ten = deriveUnlockedBadges(emptyTrainingFootprint(), {
      scores: {},
      historyLength: BADGE_HISTORY_SNAPSHOTS,
    });
    expect(nine.find((row) => row.id === 'HIST-10')).toMatchObject({
      unlocked: false,
      current: BADGE_HISTORY_SNAPSHOTS - 1,
      target: BADGE_HISTORY_SNAPSHOTS,
    });
    expect(ten.find((row) => row.id === 'HIST-10')?.unlocked).toBe(true);
  });

  it('unlocks PR-01 on any L3 day', () => {
    const views = deriveUnlockedBadges(
      footprint({ days: { '2026-08-16': 3 }, lifetimeDays: 1 }),
      { scores: {}, historyLength: 0 }
    );
    expect(views.find((row) => row.id === 'PR-01')?.unlocked).toBe(true);
  });

  it('keeps PR-01 unlocked after heatmap prune (monotonic union)', () => {
    const pruned = footprint({
      days: { '2026-08-16': 1 },
      lifetimeDays: 40,
      unlockedBadgeIds: ['PR-01', 'IGN-01'],
    });
    const views = deriveUnlockedBadges(pruned, { scores: {}, historyLength: 0 });
    expect(views.find((row) => row.id === 'PR-01')).toMatchObject({
      unlocked: true,
      current: 1,
      target: 1,
    });
    const union = applyUnlockedBadgeUnion(pruned, ['IGN-01']);
    expect(union.changed).toBe(false);
    expect(union.state.unlockedBadgeIds).toEqual(['PR-01', 'IGN-01']);
  });

  it('unlocks SPEC-6 only when all six axes are > 0 (arm size ignored)', () => {
    const missingGrip = deriveUnlockedBadges(emptyTrainingFootprint(), {
      scores: { ...SIX_LIVE, gripStrength: 0 },
      historyLength: 0,
    });
    expect(missingGrip.find((row) => row.id === 'SPEC-6')).toMatchObject({
      unlocked: false,
      current: 5,
      target: 6,
    });

    const live = deriveUnlockedBadges(emptyTrainingFootprint(), {
      scores: { ...SIX_LIVE, armSize: 99 },
      historyLength: 0,
    });
    expect(live.find((row) => row.id === 'SPEC-6')?.unlocked).toBe(true);
  });

  it('parses unknown badge ids out and keeps catalog order', () => {
    const parsed = parseTrainingFootprintState({
      schemaVersion: 1,
      days: {},
      lifetimeDays: 0,
      unlockedBadgeIds: ['TOOL-20', 'PR-01', 'IGN-01', 'PR-01'],
    });
    expect(parsed.unlockedBadgeIds).toEqual(['IGN-01', 'PR-01']);
  });
});
