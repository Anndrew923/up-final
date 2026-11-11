import { beforeAll, describe, expect, it } from 'vitest';
import i18n from '../../i18n';

describe('ladder upload i18n', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  it('resolves sync HUD copy and unchanged copy (not raw keys)', () => {
    const hudSuccess = i18n.t('ladder.syncAll.hudSuccessWithScore', {
      ns: 'common',
      score: '90.28',
    });
    expect(hudSuccess).not.toBe('ladder.syncAll.hudSuccessWithScore');
    expect(hudSuccess).toContain('90.28');
    expect(hudSuccess).toContain('天梯數據同步完成');

    const hudReady = i18n.t('ladder.syncAll.hudReady', { ns: 'common' });
    expect(hudReady).not.toBe('ladder.syncAll.hudReady');
    expect(hudReady).toContain('數據已就緒');

    const hudError = i18n.t('ladder.syncAll.hudError', { ns: 'common' });
    expect(hudError).not.toBe('ladder.syncAll.hudError');
    expect(hudError).toContain('網路');

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

    const appCheckReason = i18n.t('ladder.syncAll.failureReason.app-check', { ns: 'common' });
    expect(appCheckReason).not.toBe('ladder.syncAll.failureReason.app-check');

    const identityReason = i18n.t('ladder.syncAll.failureReason.identity-required', {
      ns: 'common',
    });
    expect(identityReason).not.toBe('ladder.syncAll.failureReason.identity-required');
    expect(identityReason.length).toBeGreaterThan(4);
    expect(appCheckReason).toContain('App Check');

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

    const shardDrift = i18n.t('ladder.userPreview.shardDriftWarning', {
      ns: 'common',
      listed: '116.91',
      preview: '91.62',
    });
    expect(shardDrift).not.toBe('ladder.userPreview.shardDriftWarning');
    expect(shardDrift).toContain('116.91');
    expect(shardDrift).toContain('91.62');
  });
});
