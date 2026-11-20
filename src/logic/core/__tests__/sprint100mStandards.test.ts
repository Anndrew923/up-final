import { describe, expect, it } from 'vitest';
import { calculateScoreDecreasing, scoreSprintOverflowAboveT100 } from '../powerScoring';
import { clampScoreMapValue } from '../scoring';
import {
  deriveSprintFloorSecondsFromWr,
  deriveSprintStandardRowFromWr,
  getSprint100mFloorSeconds,
  getSprint100mStandardRow,
  getSprint100mWrSeconds,
  SPRINT_100M_WR_SECONDS,
  SPRINT_STANDARDS_FEMALE,
  SPRINT_STANDARDS_MALE,
  SPRINT_WR_TO_T100_OFFSET_SECONDS,
} from '../sprint100mStandards';
import type { PowerAgeBucket } from '../powerAgeRange';

const BUCKETS = Object.keys(SPRINT_100M_WR_SECONDS.male) as PowerAgeBucket[];
const AGE_IN_BUCKET: Record<PowerAgeBucket, number> = {
  '12-15': 14,
  '16-20': 18,
  '21-30': 25,
  '31-40': 35,
  '41-50': 45,
  '51-60': 55,
  '61-70': 65,
  '71-80': 75,
};

describe('sprint100mStandards WR SSOT', () => {
  it('derives T100/T50/T0 and floor from WR offsets', () => {
    const row = deriveSprintStandardRowFromWr(9.58);
    expect(row).toEqual({ 0: 17, 50: 14, 100: 11 });
    expect(deriveSprintFloorSecondsFromWr(9.58)).toBe(9.45);
    expect(deriveSprintFloorSecondsFromWr(9.93)).toBe(9.8);
  });

  it('scores every age/sex WR at 177.19 via derived T100', () => {
    for (const gender of ['male', 'female'] as const) {
      for (const bucket of BUCKETS) {
        const wr = SPRINT_100M_WR_SECONDS[gender][bucket];
        const std = gender === 'male' ? SPRINT_STANDARDS_MALE[bucket] : SPRINT_STANDARDS_FEMALE[bucket];
        expect(std[100]).toBe(Number((wr + SPRINT_WR_TO_T100_OFFSET_SECONDS).toFixed(2)));
        expect(calculateScoreDecreasing(wr, std)).toBeCloseTo(177.19, 2);
        expect(scoreSprintOverflowAboveT100(std[100] - wr)).toBeCloseTo(177.19, 2);
        expect(getSprint100mStandardRow(gender, AGE_IN_BUCKET[bucket])).toEqual(std);
      }
    }
  });

  it('floors every age/sex bucket to WR−0.13 and clamps score to 200', () => {
    for (const gender of ['male', 'female'] as const) {
      for (const bucket of BUCKETS) {
        const wr = SPRINT_100M_WR_SECONDS[gender][bucket];
        const floor = deriveSprintFloorSecondsFromWr(wr);
        const std = gender === 'male' ? SPRINT_STANDARDS_MALE[bucket] : SPRINT_STANDARDS_FEMALE[bucket];
        expect(getSprint100mFloorSeconds(gender, AGE_IN_BUCKET[bucket])).toBe(floor);
        const raw = calculateScoreDecreasing(floor, std);
        expect(raw).toBeCloseTo(200.26, 2);
        expect(clampScoreMapValue(raw)).toBe(200);
      }
    }
  });

  it('resolves WR and floor by age', () => {
    expect(getSprint100mWrSeconds('male', 45)).toBe(9.93);
    expect(getSprint100mFloorSeconds('male', 45)).toBe(9.8);
    expect(getSprint100mWrSeconds('female', 25)).toBe(10.49);
    expect(getSprint100mFloorSeconds('female', 25)).toBe(10.36);
    // Missing age → peak 21–30 floor
    expect(getSprint100mFloorSeconds('male')).toBe(9.45);
    expect(getSprint100mFloorSeconds('female')).toBe(10.36);
  });
});
