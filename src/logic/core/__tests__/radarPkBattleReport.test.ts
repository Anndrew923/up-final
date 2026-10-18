import { describe, expect, it } from 'vitest';
import type { ScoreMap } from '../../../types/scoring';
import { SIX_AXIS_METRICS } from '../../../types/scoring';
import {
  buildRadarPkBattleReport,
  formatRadarPkOverallDelta,
  radarPkBattleBadgeParams,
  resolveRadarPkBattleStatus,
} from '../radarPkBattleReport';

function fullMap(value: number): ScoreMap {
  return Object.fromEntries(SIX_AXIS_METRICS.map((m) => [m, value])) as ScoreMap;
}

describe('resolveRadarPkBattleStatus', () => {
  it('maps margins to combat status keys', () => {
    expect(resolveRadarPkBattleStatus(5, 1)).toBe('dominance');
    expect(resolveRadarPkBattleStatus(4, 2)).toBe('dominance');
    expect(resolveRadarPkBattleStatus(3, 2)).toBe('lead');
    expect(resolveRadarPkBattleStatus(3, 3)).toBe('even');
    expect(resolveRadarPkBattleStatus(2, 4)).toBe('trailing');
  });
});

describe('formatRadarPkOverallDelta', () => {
  it('formats signed two-decimal deltas', () => {
    expect(formatRadarPkOverallDelta(10.42)).toBe('+10.42');
    expect(formatRadarPkOverallDelta(-3.2)).toBe('-3.20');
    expect(formatRadarPkOverallDelta(0)).toBe('0.00');
  });
});

describe('buildRadarPkBattleReport', () => {
  it('counts multi-axis dominance for the viewer', () => {
    const target: ScoreMap = {
      strength: 40,
      explosivePower: 40,
      cardio: 40,
      muscleMass: 40,
      bodyFat: 40,
      gripStrength: 40,
    };
    const viewer: ScoreMap = {
      strength: 80,
      explosivePower: 80,
      cardio: 80,
      muscleMass: 80,
      bodyFat: 30,
      gripStrength: 30,
    };
    const report = buildRadarPkBattleReport(target, viewer);
    expect(report.wins).toBe(4);
    expect(report.losses).toBe(2);
    expect(report.ties).toBe(0);
    expect(report.status).toBe('dominance');
    expect(report.axisWinners.strength).toBe('viewer');
    expect(report.axisWinners.bodyFat).toBe('target');
    expect(report.overallDelta).toBeGreaterThan(0);
  });

  it('marks slight lead when viewer wins by one axis', () => {
    const target: ScoreMap = {
      strength: 40,
      explosivePower: 50,
      cardio: 50,
      muscleMass: 50,
      bodyFat: 50,
      gripStrength: 50,
    };
    const viewer: ScoreMap = {
      strength: 60,
      explosivePower: 50,
      cardio: 50,
      muscleMass: 50,
      bodyFat: 50,
      gripStrength: 50,
    };
    const report = buildRadarPkBattleReport(target, viewer);
    expect(report.wins).toBe(1);
    expect(report.losses).toBe(0);
    expect(report.ties).toBe(5);
    expect(report.status).toBe('lead');
    expect(radarPkBattleBadgeParams(report)).toEqual({
      wins: 1,
      losses: 0,
      delta: formatRadarPkOverallDelta(report.overallDelta),
    });
  });

  it('detects even axis split', () => {
    const target: ScoreMap = {
      strength: 50,
      explosivePower: 50,
      cardio: 50,
      muscleMass: 40,
      bodyFat: 40,
      gripStrength: 40,
    };
    const viewer: ScoreMap = {
      strength: 40,
      explosivePower: 40,
      cardio: 40,
      muscleMass: 50,
      bodyFat: 50,
      gripStrength: 50,
    };
    const report = buildRadarPkBattleReport(target, viewer);
    expect(report.wins).toBe(3);
    expect(report.losses).toBe(3);
    expect(report.status).toBe('even');
  });

  it('marks trailing when viewer loses the majority', () => {
    const report = buildRadarPkBattleReport(fullMap(70), fullMap(40));
    expect(report.wins).toBe(0);
    expect(report.losses).toBe(6);
    expect(report.status).toBe('trailing');
    expect(report.overallDelta).toBeLessThan(0);
    expect(formatRadarPkOverallDelta(report.overallDelta).startsWith('-')).toBe(true);
  });

  it('ties all axes when both maps are empty', () => {
    const report = buildRadarPkBattleReport(null, undefined);
    expect(report.wins).toBe(0);
    expect(report.losses).toBe(0);
    expect(report.ties).toBe(6);
    expect(report.status).toBe('even');
    expect(report.overallDelta).toBe(0);
    for (const metric of SIX_AXIS_METRICS) {
      expect(report.axisWinners[metric]).toBe('tie');
    }
  });
});
