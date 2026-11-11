import { beforeAll, describe, expect, it } from 'vitest';
import i18n from '../../../i18n';
import {
  resolveBreakthroughPipelineCopyKey,
  resolveMembershipSyncSurface,
  resolvePublishSuccessBannerKey,
} from '../membershipSyncSurface';

describe('resolveMembershipSyncSurface', () => {
  it('returns pending while guild binding is unknown', () => {
    expect(resolveMembershipSyncSurface(null)).toBe('pending');
  });

  it('returns dual when in a club', () => {
    expect(resolveMembershipSyncSurface(true)).toBe('dual');
  });

  it('returns global-only when not in a club', () => {
    expect(resolveMembershipSyncSurface(false)).toBe('global-only');
  });
});

describe('resolvePublishSuccessBannerKey', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  it('maps cloud outcomes to breakthrough banner keys', () => {
    expect(resolvePublishSuccessBannerKey('arena')).toContain('ArenaSuccess');
    expect(resolvePublishSuccessBannerKey('guild')).toContain('GuildSuccess');
    expect(resolvePublishSuccessBannerKey('arena+guild')).toContain('ArenaGuildSuccess');
  });

  it('arena+guild copy is full dual sync — never guild-only not-public wording', () => {
    const key = resolvePublishSuccessBannerKey('arena+guild');
    const copy = i18n.t(key, { ns: 'common' });
    expect(copy).not.toBe(key);
    expect(copy).not.toContain('未公開全球');
    expect(copy).toContain('全數同步');
  });

  it('maps pipeline banners to copy keys without guild-only wording for dual', () => {
    const dualKey = resolveBreakthroughPipelineCopyKey('arena-guild-success');
    expect(dualKey).toBe('assessment.breakthrough.dashboardAndArenaGuildSuccess');
    const dualCopy = i18n.t(dualKey!, { ns: 'common' });
    expect(dualCopy).not.toContain('未公開全球');

    expect(resolveBreakthroughPipelineCopyKey('guild-success')).toBe(
      'assessment.breakthrough.dashboardAndGuildSuccess'
    );
    expect(resolveBreakthroughPipelineCopyKey('dashboard-only')).toBe(
      'assessment.breakthrough.dashboardPersistedOnly'
    );
    expect(resolveBreakthroughPipelineCopyKey('none')).toBeNull();
  });
});
