import { describe, expect, it } from 'vitest';
import {
  normalizeGuildNameClient,
  normalizeGuildTagClient,
  parseGuildDoc,
  parseUserGuildBinding,
  sortGuildMembersByScore,
} from '../guildDoc';

describe('parseUserGuildBinding', () => {
  it('reads camelCase guild fields', () => {
    expect(parseUserGuildBinding({ guildId: 'g1', guildRole: 'coach' })).toEqual({
      guildId: 'g1',
      guildRole: 'coach',
    });
  });

  it('defaults role to member and ignores empty id', () => {
    expect(parseUserGuildBinding({ guildId: 'g2' })?.guildRole).toBe('member');
    expect(parseUserGuildBinding({ guildId: '  ' })).toBeNull();
    expect(parseUserGuildBinding(null)).toBeNull();
  });
});

describe('parseGuildDoc', () => {
  it('parses active guild payload', () => {
    const doc = parseGuildDoc('g1', {
      name: 'Iron',
      tag: 'ARN',
      coachUid: 'c1',
      inviteCode: 'ABCDEF',
      memberCount: 2,
      maxMembers: 30,
      memberUids: ['c1', 'm1'],
      members: [
        { uid: 'c1', displayName: 'Coach', ladderScore: 10, updatedAt: '2026-01-01T00:00:00.000Z' },
        { uid: 'm1', displayName: 'Mate', ladderScore: 20, updatedAt: '2026-01-02T00:00:00.000Z' },
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
      status: 'active',
    });
    expect(doc?.id).toBe('g1');
    expect(doc?.members).toHaveLength(2);
  });

  it('rejects disbanded or incomplete docs', () => {
    expect(parseGuildDoc('g1', { status: 'disbanded', name: 'X', tag: 'ARN', coachUid: 'c', inviteCode: 'ABCDEF' })).toBeNull();
    expect(parseGuildDoc('g1', { name: 'X' })).toBeNull();
  });
});

describe('sortGuildMembersByScore', () => {
  it('sorts descending by ladderScore', () => {
    const sorted = sortGuildMembersByScore([
      { uid: 'a', displayName: 'A', ladderScore: 10, updatedAt: 't' },
      { uid: 'b', displayName: 'B', ladderScore: 30, updatedAt: 't' },
      { uid: 'c', displayName: 'C', ladderScore: 20, updatedAt: 't' },
    ]);
    expect(sorted.map((m) => m.uid)).toEqual(['b', 'c', 'a']);
  });
});

describe('normalizeGuildNameClient / tag', () => {
  it('accepts valid shapes', () => {
    expect(normalizeGuildNameClient('  Iron  Crew ').ok).toBe(true);
    expect(normalizeGuildTagClient('arn').ok).toBe(true);
    if (normalizeGuildTagClient('arn').ok) {
      expect(normalizeGuildTagClient('arn')).toEqual({ ok: true, tag: 'ARN' });
    }
  });

  it('rejects invalid shapes', () => {
    expect(normalizeGuildNameClient('x').ok).toBe(false);
    expect(normalizeGuildTagClient('IRN').ok).toBe(false);
    expect(normalizeGuildTagClient('A').ok).toBe(false);
  });
});
