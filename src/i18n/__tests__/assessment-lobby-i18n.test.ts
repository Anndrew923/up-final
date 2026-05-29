import { beforeAll, describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import { ASSESSMENT_LOBBY_CARD_KEYS } from '../../config/assessmentLobby';

describe('assessment lobby i18n', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  it('resolves page title (not raw key)', () => {
    const key = 'assessment.title';
    const value = i18n.t(key, { ns: 'common' });
    expect(value).not.toBe(key);
    expect(value).toContain('DYNO');
  });

  it.each(ASSESSMENT_LOBBY_CARD_KEYS)('resolves lobby card kicker/title for %s', (cardKey) => {
    const kickerKey = `assessment.${cardKey}.kicker`;
    const titleKey = `assessment.${cardKey}.title`;
    expect(i18n.t(kickerKey, { ns: 'common' })).not.toBe(kickerKey);
    expect(i18n.t(titleKey, { ns: 'common' })).not.toBe(titleKey);
  });
});
