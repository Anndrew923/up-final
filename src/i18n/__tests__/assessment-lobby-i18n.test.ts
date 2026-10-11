import { beforeAll, describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import { ASSESSMENT_LOBBY_CARD_KEYS } from '../../config/assessmentLobby';

const LOBBY_LOCALES = ['zh-Hant', 'en'] as const;

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

  it.each(
    LOBBY_LOCALES.flatMap((locale) =>
      ASSESSMENT_LOBBY_CARD_KEYS.map((cardKey) => [locale, cardKey] as const)
    )
  )('keeps %s lobby card title pure for %s (Plan A)', async (locale, cardKey) => {
    await i18n.changeLanguage(locale);
    const title = i18n.t(`assessment.${cardKey}.title`, { ns: 'common' });
    expect(title.length).toBeGreaterThan(0);
    expect(title).not.toMatch(/[（(].+[）)]/);
    expect(title).not.toMatch(/\/\//);
    expect(title).not.toMatch(/\b(BOOST|AERO|TORQUE|RIMS)\b/);
  });

  it.each(LOBBY_LOCALES)('resolves glance unset copy for %s', async (locale) => {
    await i18n.changeLanguage(locale);
    const key = 'assessment.lobby.glanceUnset';
    const value = i18n.t(key, { ns: 'common' });
    expect(value).not.toBe(key);
    expect(value.length).toBeGreaterThan(0);
  });
});
