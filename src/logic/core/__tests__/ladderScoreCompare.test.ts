import { describe, expect, it } from 'vitest';
import {
  isLadderOverallEntryDriftFromPreview,
  resolveLadderEntryPreviewDrift,
  resolveLadderPreviewComparable,
  scoresEqualForLadderWrite,
} from '../ladderScoreCompare';

describe('scoresEqualForLadderWrite', () => {
  it('treats values equal at two decimal places', () => {
    expect(scoresEqualForLadderWrite(98.364, 98.36)).toBe(true);
    expect(scoresEqualForLadderWrite(100, 100)).toBe(true);
  });

  it('detects meaningful changes including lower scores', () => {
    expect(scoresEqualForLadderWrite(100, 99.99)).toBe(false);
    expect(scoresEqualForLadderWrite(120, 119)).toBe(false);
  });
});

describe('isLadderOverallEntryDriftFromPreview', () => {
  it('flags drift between list score and preview average', () => {
    expect(isLadderOverallEntryDriftFromPreview(98.82, 93.31)).toBe(true);
    expect(isLadderOverallEntryDriftFromPreview(93.31, 93.31)).toBe(false);
  });

  it('returns false when inputs are missing', () => {
    expect(isLadderOverallEntryDriftFromPreview(null, 90)).toBe(false);
    expect(isLadderOverallEntryDriftFromPreview(90, null)).toBe(false);
  });
});

describe('resolveLadderPreviewComparable', () => {
  it('maps composite shards to radar axes and excludes branch shards', () => {
    expect(resolveLadderPreviewComparable('ladderScore')).toEqual({ kind: 'overall' });
    expect(resolveLadderPreviewComparable('muscleMass')).toEqual({
      kind: 'axis',
      metric: 'muscleMass',
    });
    expect(resolveLadderPreviewComparable('muscleMass_weightKg')).toBeNull();
    expect(resolveLadderPreviewComparable('muscleMass_ratio')).toBeNull();
    expect(resolveLadderPreviewComparable('strength')).toBeNull();
    expect(resolveLadderPreviewComparable('strength_totalFive')).toEqual({
      kind: 'axis',
      metric: 'strength',
    });
    expect(resolveLadderPreviewComparable('explosive_vertical')).toBeNull();
    expect(resolveLadderPreviewComparable('explosive_composite')).toEqual({
      kind: 'axis',
      metric: 'explosivePower',
    });
  });
});

describe('resolveLadderEntryPreviewDrift', () => {
  it('flags muscleMass list vs preview axis drift (user report: 116.91 vs 91.62)', () => {
    const result = resolveLadderEntryPreviewDrift({
      shardId: 'muscleMass',
      entryScoreBest: 116.91,
      previewOverall: 100,
      previewRadarScores: { muscleMass: 91.62 },
    });
    expect(result.drifted).toBe(true);
    expect(result.comparable).toEqual({ kind: 'axis', metric: 'muscleMass' });
    expect(result.previewScore).toBe(91.62);
  });

  it('does not flag weight-branch shard against composite radar', () => {
    const result = resolveLadderEntryPreviewDrift({
      shardId: 'muscleMass_weightKg',
      entryScoreBest: 116.91,
      previewOverall: 100,
      previewRadarScores: { muscleMass: 91.62 },
    });
    expect(result.drifted).toBe(false);
    expect(result.comparable).toBeNull();
  });

  it('flags overall board drift via the unified resolver', () => {
    const result = resolveLadderEntryPreviewDrift({
      shardId: 'ladderScore',
      entryScoreBest: 98.82,
      previewOverall: 93.31,
      previewRadarScores: {},
    });
    expect(result.drifted).toBe(true);
    expect(result.comparable).toEqual({ kind: 'overall' });
  });

  it('returns no drift when scores match at 2dp', () => {
    const result = resolveLadderEntryPreviewDrift({
      shardId: 'muscleMass',
      entryScoreBest: 91.62,
      previewOverall: 90,
      previewRadarScores: { muscleMass: 91.619 },
    });
    expect(result.drifted).toBe(false);
  });
});
