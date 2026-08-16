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
  BADGE_ARCHIVE_SNAPSHOTS,
  BADGE_BREAKIN_DAYS,
  BADGE_CRUISE_WEEKS,
  BADGE_HISTORY_SNAPSHOTS,
  BADGE_RUN_IN_DAYS,
  countConsecutiveQualifiedWeeks,
  deriveUnlockedBadges,
  resolveRun5KmFinishSeconds,
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

  it('unlocks ARC-01 on the first snapshot, not on empty history', () => {
    const empty = deriveUnlockedBadges(emptyTrainingFootprint(), {
      scores: {},
      historyLength: 0,
    });
    const archived = deriveUnlockedBadges(emptyTrainingFootprint(), {
      scores: {},
      historyLength: BADGE_ARCHIVE_SNAPSHOTS,
    });
    expect(empty.find((row) => row.id === 'ARC-01')).toMatchObject({
      unlocked: false,
      current: 0,
      target: BADGE_ARCHIVE_SNAPSHOTS,
    });
    expect(archived.find((row) => row.id === 'ARC-01')?.unlocked).toBe(true);
  });

  it('unlocks RHY-03 when the current week hits 3 attendance days', () => {
    const monday = startOfLocalIsoWeek(NOW);
    const shortDays: Record<string, FootprintLevel> = {};
    markWeekDays(monday, 2, shortDays);
    const short = deriveUnlockedBadges(
      footprint({ days: shortDays, lifetimeDays: 2 }),
      { scores: {}, historyLength: 0 },
      NOW
    );
    expect(short.find((row) => row.id === 'RHY-03')).toMatchObject({
      unlocked: false,
      current: 2,
      target: 3,
    });

    const fullDays: Record<string, FootprintLevel> = {};
    markWeekDays(monday, 3, fullDays);
    const full = deriveUnlockedBadges(
      footprint({ days: fullDays, lifetimeDays: 3 }),
      { scores: {}, historyLength: 0 },
      NOW
    );
    expect(full.find((row) => row.id === 'RHY-03')?.unlocked).toBe(true);
  });

  it('keeps RHY-03 unlocked after a short later week (monotonic)', () => {
    const views = deriveUnlockedBadges(
      footprint({
        days: { '2026-08-16': 1 },
        lifetimeDays: 4,
        unlockedBadgeIds: ['RHY-03'],
      }),
      { scores: {}, historyLength: 0 },
      NOW
    );
    expect(views.find((row) => row.id === 'RHY-03')).toMatchObject({
      unlocked: true,
      current: 3,
      target: 3,
    });
  });

  it('unlocks RUN-07 at 7 lifetime days, not 6', () => {
    const six = deriveUnlockedBadges(footprint({ days: {}, lifetimeDays: BADGE_RUN_IN_DAYS - 1 }), {
      scores: {},
      historyLength: 0,
    });
    const seven = deriveUnlockedBadges(footprint({ days: {}, lifetimeDays: BADGE_RUN_IN_DAYS }), {
      scores: {},
      historyLength: 0,
    });
    expect(six.find((row) => row.id === 'RUN-07')).toMatchObject({
      unlocked: false,
      current: BADGE_RUN_IN_DAYS - 1,
      target: BADGE_RUN_IN_DAYS,
    });
    expect(seven.find((row) => row.id === 'RUN-07')?.unlocked).toBe(true);
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

  it('unlocks ARM-01 from a positive arm-size score, not from six-axis fill', () => {
    const empty = deriveUnlockedBadges(emptyTrainingFootprint(), {
      scores: { ...SIX_LIVE },
      historyLength: 0,
    });
    expect(empty.find((row) => row.id === 'ARM-01')).toMatchObject({
      unlocked: false,
      current: 0,
      target: 1,
    });
    const armed = deriveUnlockedBadges(emptyTrainingFootprint(), {
      scores: { armSize: 40 },
      historyLength: 0,
    });
    expect(armed.find((row) => row.id === 'ARM-01')?.unlocked).toBe(true);
  });

  it('unlocks 5K-01 and SPR-01 from specialty raw, not radar axes', () => {
    const locked = deriveUnlockedBadges(emptyTrainingFootprint(), {
      scores: { cardio: 90, explosivePower: 90 },
      historyLength: 0,
    });
    expect(locked.find((row) => row.id === '5K-01')?.unlocked).toBe(false);
    expect(locked.find((row) => row.id === 'SPR-01')?.unlocked).toBe(false);

    const specialty = deriveUnlockedBadges(emptyTrainingFootprint(), {
      scores: {},
      historyLength: 0,
      run5KmTotalSeconds: 1350,
      sprintSeconds: 14,
    });
    expect(specialty.find((row) => row.id === '5K-01')?.unlocked).toBe(true);
    expect(specialty.find((row) => row.id === 'SPR-01')?.unlocked).toBe(true);
  });

  it('resolves 5 km finish seconds from split fields when totalSeconds is missing', () => {
    expect(resolveRun5KmFinishSeconds(undefined)).toBeNull();
    expect(resolveRun5KmFinishSeconds({ totalSeconds: 0 })).toBeNull();
    expect(resolveRun5KmFinishSeconds({ totalSeconds: 1350 })).toBe(1350);
    expect(resolveRun5KmFinishSeconds({ minutes: 22, seconds: 30 })).toBe(1350);
    expect(resolveRun5KmFinishSeconds({ minutes: 0, seconds: 0 })).toBeNull();
  });

  it('keeps optional spec badges unlocked after raw is cleared (monotonic)', () => {
    const views = deriveUnlockedBadges(
      footprint({
        days: {},
        lifetimeDays: 1,
        unlockedBadgeIds: ['ARM-01', '5K-01', 'SPR-01'],
      }),
      { scores: {}, historyLength: 0 }
    );
    expect(views.find((row) => row.id === 'ARM-01')?.unlocked).toBe(true);
    expect(views.find((row) => row.id === '5K-01')?.unlocked).toBe(true);
    expect(views.find((row) => row.id === 'SPR-01')?.unlocked).toBe(true);
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
