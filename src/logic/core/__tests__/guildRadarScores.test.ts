import { describe, expect, it } from 'vitest';
import type { GuildMemberSnapshot } from '../../../types/guild';
import {
  guildMemberDimensionScore,
  guildMemberHasRadarScores,
  sanitizeGuildRadarScores,
  sortGuildMembersByDimension,
} from '../guildRadarScores';

function member(
  partial: Partial<GuildMemberSnapshot> & Pick<GuildMemberSnapshot, 'uid'>
): GuildMemberSnapshot {
  return {
    displayName: partial.displayName ?? partial.uid,
    ladderScore: partial.ladderScore ?? 0,
    updatedAt: partial.updatedAt ?? 't0',
    ...partial,
  };
}

describe('sanitizeGuildRadarScores', () => {
  it('clamps present axes only (no invented zeros)', () => {
    const radar = sanitizeGuildRadarScores({
      strength: 88.456,
      cardio: 50,
    });
    expect(radar?.strength).toBe(88.46);
    expect(radar?.cardio).toBe(50);
    expect(radar?.explosivePower).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(radar, 'gripStrength')).toBe(false);
  });

  it('returns undefined for empty input', () => {
    expect(sanitizeGuildRadarScores(null)).toBeUndefined();
    expect(sanitizeGuildRadarScores({})).toBeUndefined();
  });
});

describe('sortGuildMembersByDimension', () => {
  const roster = [
    member({
      uid: 'a',
      displayName: 'Alpha',
      ladderScore: 90,
      radarScores: {
        strength: 40,
        explosivePower: 10,
        cardio: 10,
        muscleMass: 10,
        bodyFat: 10,
        gripStrength: 10,
      },
    }),
    member({
      uid: 'b',
      displayName: 'Beta',
      ladderScore: 50,
      radarScores: {
        strength: 95,
        explosivePower: 10,
        cardio: 10,
        muscleMass: 10,
        bodyFat: 10,
        gripStrength: 10,
      },
    }),
    member({ uid: 'c', displayName: 'Ghost', ladderScore: 70 }),
  ];

  it('sorts by overall descending', () => {
    const sorted = sortGuildMembersByDimension(roster, 'overall');
    expect(sorted.map((m) => m.uid)).toEqual(['a', 'c', 'b']);
  });

  it('sorts by strength and pushes missing radar to end', () => {
    const sorted = sortGuildMembersByDimension(roster, 'strength');
    expect(sorted.map((m) => m.uid)).toEqual(['b', 'a', 'c']);
    expect(guildMemberDimensionScore(sorted[0], 'strength')).toBe(95);
    expect(guildMemberDimensionScore(sorted[2], 'strength')).toBeNull();
  });

  it('treats absent axis key as missing even when other axes exist', () => {
    const partial = member({
      uid: 'p',
      ladderScore: 10,
      radarScores: { strength: 80 },
    });
    expect(guildMemberDimensionScore(partial, 'cardio')).toBeNull();
    expect(guildMemberDimensionScore(partial, 'strength')).toBe(80);
  });

  it('detects radar presence', () => {
    expect(guildMemberHasRadarScores(roster[0])).toBe(true);
    expect(guildMemberHasRadarScores(roster[2])).toBe(false);
  });
});
