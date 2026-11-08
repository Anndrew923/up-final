import { describe, expect, it } from 'vitest';
import {
  findGuildMemberByFocusUid,
  parseCrewFocusUid,
} from '../crewFocusUid';
import type { GuildMemberSnapshot } from '../../../types/guild';

const roster: GuildMemberSnapshot[] = [
  { uid: 'u1', displayName: 'Alpha', ladderScore: 90, updatedAt: 't0' },
  { uid: 'u2', displayName: 'Beta', ladderScore: 80, updatedAt: 't0' },
];

describe('parseCrewFocusUid', () => {
  it('trims and rejects empty', () => {
    expect(parseCrewFocusUid('  u1  ')).toBe('u1');
    expect(parseCrewFocusUid('')).toBeNull();
    expect(parseCrewFocusUid('   ')).toBeNull();
    expect(parseCrewFocusUid(null)).toBeNull();
  });
});

describe('findGuildMemberByFocusUid', () => {
  it('returns member when on roster', () => {
    expect(findGuildMemberByFocusUid(roster, 'u2')?.displayName).toBe('Beta');
  });

  it('returns null for unknown / empty roster', () => {
    expect(findGuildMemberByFocusUid(roster, 'unknown')).toBeNull();
    expect(findGuildMemberByFocusUid([], 'u1')).toBeNull();
    expect(findGuildMemberByFocusUid(null, 'u1')).toBeNull();
  });
});
