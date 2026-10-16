import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GuildDoc } from '../../types/guild';
import {
  clearGuildCache,
  clearUserGuildBindingCache,
  GUILD_LADDER_TTL_MS,
  invalidateGuildLadderCache,
  lookupGuildCache,
  setGuildCache,
  setUserGuildBindingCache,
  fetchUserGuildBinding,
} from '../guildLadderCacheService';

function sampleGuild(id = 'g1'): GuildDoc {
  return {
    id,
    name: 'Iron',
    tag: 'ARN',
    coachUid: 'c1',
    inviteCode: 'ABCDEF',
    memberCount: 1,
    maxMembers: 30,
    memberUids: ['c1'],
    members: [
      { uid: 'c1', displayName: 'Coach', ladderScore: 12.5, updatedAt: '2026-01-01T00:00:00.000Z' },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    status: 'active',
  };
}

describe('guildLadderCacheService', () => {
  beforeEach(() => {
    clearGuildCache();
    vi.useRealTimers();
  });

  afterEach(() => {
    clearGuildCache();
    vi.useRealTimers();
  });

  it('stores and returns fresh cache within TTL', () => {
    const now = Date.parse('2026-10-16T12:00:00.000Z');
    setGuildCache(sampleGuild(), new Date(now).toISOString());
    const hit = lookupGuildCache('g1', now, GUILD_LADDER_TTL_MS);
    expect(hit?.freshness).toBe('fresh');
    expect(hit?.data.guild.name).toBe('Iron');
  });

  it('marks cache stale after TTL', () => {
    const cachedAt = Date.parse('2026-10-16T12:00:00.000Z');
    setGuildCache(sampleGuild(), new Date(cachedAt).toISOString());
    const later = cachedAt + GUILD_LADDER_TTL_MS + 1;
    const hit = lookupGuildCache('g1', later, GUILD_LADDER_TTL_MS);
    expect(hit?.freshness).toBe('stale');
  });

  it('clears by guild id', () => {
    setGuildCache(sampleGuild('g1'));
    setGuildCache(sampleGuild('g2'));
    clearGuildCache('g1');
    expect(lookupGuildCache('g1')).toBeNull();
    expect(lookupGuildCache('g2')).not.toBeNull();
  });

  it('serves user guild binding from session TTL without Firestore', async () => {
    clearUserGuildBindingCache();
    setUserGuildBindingCache('u1', { guildId: 'g1', guildRole: 'member' });
    const binding = await fetchUserGuildBinding('u1');
    expect(binding).toEqual({ guildId: 'g1', guildRole: 'member' });
    clearUserGuildBindingCache('u1');
    // No Firestore in unit env — miss returns null after clear.
    expect(await fetchUserGuildBinding('u1')).toBeNull();
  });

  it('invalidateGuildLadderCache clears TTL entries (Sprint C upload path)', () => {
    setGuildCache(sampleGuild('g1'));
    expect(lookupGuildCache('g1')).not.toBeNull();
    invalidateGuildLadderCache('g1');
    expect(lookupGuildCache('g1')).toBeNull();
  });

  it('invalidateGuildLadderCache dispatches live-refresh event', () => {
    const seen: unknown[] = [];
    const handler = (e: Event) => seen.push(e);
    window.addEventListener('up-final-guild-ladder-cache-invalidated', handler);
    try {
      invalidateGuildLadderCache('g9');
      expect(seen).toHaveLength(1);
    } finally {
      window.removeEventListener('up-final-guild-ladder-cache-invalidated', handler);
    }
  });
});
