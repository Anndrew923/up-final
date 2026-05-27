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
      errors: 0,
    });
    expect(summary).not.toBe('ladder.syncAll.summary');
    expect(summary).toContain('20');

    const unchanged = i18n.t('ladder.upload.resultUnchanged', { ns: 'common' });
    expect(unchanged).not.toBe('ladder.upload.resultUnchanged');
    expect(unchanged.length).toBeGreaterThan(4);
  });
});
