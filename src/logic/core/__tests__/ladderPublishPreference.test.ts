import { describe, expect, it } from 'vitest';
import {
  resolvePublishBusyCopyKey,
  resolvePublishCtaCopyKey,
  resolvePublishHintCopyKey,
  resolvePublishMode,
  resolvePublishSuccessBannerKey,
} from '../ladderPublishPreference';

describe('resolvePublishMode', () => {
  it('returns global when wantsGlobal is true regardless of guild', () => {
    expect(resolvePublishMode(true, false)).toBe('global');
    expect(resolvePublishMode(true, true)).toBe('global');
  });

  it('returns guild-only when opting out of global but in a crew', () => {
    expect(resolvePublishMode(false, true)).toBe('guild-only');
  });

  it('returns local-only when opting out of global and not in a crew', () => {
    expect(resolvePublishMode(false, false)).toBe('local-only');
  });

  it('returns pending while guild membership is unknown', () => {
    expect(resolvePublishMode(false, null)).toBe('pending');
    expect(resolvePublishMode(true, null)).toBe('global');
  });
});

describe('publish copy key helpers', () => {
  it('maps cta / busy / hint / success keys per mode', () => {
    expect(resolvePublishCtaCopyKey('global')).toContain('syncDashboardThenArena');
    expect(resolvePublishCtaCopyKey('guild-only')).toContain('GuildOnly');
    expect(resolvePublishCtaCopyKey('local-only')).toContain('LocalOnly');

    expect(resolvePublishBusyCopyKey('guild-only')).toContain('GuildOnlyBusy');
    expect(resolvePublishBusyCopyKey('local-only')).toContain('LocalOnlyBusy');

    expect(resolvePublishHintCopyKey('global')).toContain('publishGlobalHint');
    expect(resolvePublishHintCopyKey('guild-only')).toContain('publishGuildOnlyHint');
    expect(resolvePublishHintCopyKey('local-only')).toContain('publishLocalOnlyHint');

    expect(resolvePublishSuccessBannerKey('global')).toContain('ArenaSuccess');
    expect(resolvePublishSuccessBannerKey('guild-only')).toContain('GuildSuccess');
    expect(resolvePublishSuccessBannerKey('local-only')).toContain('LocalOnlySuccess');
  });
});
