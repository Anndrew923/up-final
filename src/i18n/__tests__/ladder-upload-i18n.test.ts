import { beforeAll, describe, expect, it } from 'vitest';
import i18n from '../../i18n';

describe('ladder upload i18n', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  it('resolves sync summary and unchanged copy (not raw keys)', () => {
    const summary = i18n.t('ladder.syncAll.summary', {
      ns: 'common',
      attempted: 20,
      updated: 1,
      unchanged: 19,
      rateLimited: 0,
      proRequired: 0,
      invalidInput: 0,
      internal: 0,
      errors: 0,
    });
    expect(summary).not.toBe('ladder.syncAll.summary');
    expect(summary).toContain('20');

    const unchanged = i18n.t('ladder.upload.resultUnchanged', { ns: 'common' });
    expect(unchanged).not.toBe('ladder.upload.resultUnchanged');
    expect(unchanged.length).toBeGreaterThan(4);

    const avatarFail = i18n.t('ladder.upload.resultAvatarUploadFailed', { ns: 'common' });
    expect(avatarFail).not.toBe('ladder.upload.resultAvatarUploadFailed');
    expect(avatarFail).toContain('大頭照');

    const avatarReason = i18n.t('ladder.syncAll.failureReason.avatar-upload-failed', {
      ns: 'common',
    });
    expect(avatarReason).not.toBe('ladder.syncAll.failureReason.avatar-upload-failed');

    const cooldown = i18n.t('ladder.syncAll.fullSyncCooldown', {
      ns: 'common',
      resetTime: '12:00',
    });
    expect(cooldown).not.toBe('ladder.syncAll.fullSyncCooldown');
    expect(cooldown).toContain('12:00');

    const dailyCap = i18n.t('ladder.syncAll.fullSyncDailyCap', {
      ns: 'common',
      resetTime: '00:00',
    });
    expect(dailyCap).not.toBe('ladder.syncAll.fullSyncDailyCap');
    expect(dailyCap.length).toBeGreaterThan(8);
  });

  it('resolves user preview entry-fallback copy (not raw keys)', () => {
    const notice = i18n.t('ladder.userPreview.entryFallbackNotice', { ns: 'common' });
    expect(notice).not.toBe('ladder.userPreview.entryFallbackNotice');
    expect(notice).toContain('同步');

    const radarPending = i18n.t('ladder.userPreview.entryFallbackRadarPending', {
      ns: 'common',
    });
    expect(radarPending).not.toBe('ladder.userPreview.entryFallbackRadarPending');
    expect(radarPending.length).toBeGreaterThan(4);
  });
});
