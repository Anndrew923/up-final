import { describe, expect, it, beforeAll } from 'vitest';
import i18n from '../../i18n';
import { resolveOverallGradeTierCopy } from '../resolveOverallGradeCopy';

describe('resolveOverallGradeTierCopy', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  it('resolves nested name/desc for zh-Hant TIER_91', () => {
    const copy = resolveOverallGradeTierCopy(i18n.t.bind(i18n), 'TIER_91');
    expect(copy.name).toContain('UNLIMITED ATTACK');
    expect(copy.desc).toContain('極限馬力');
    expect(copy.name).not.toContain('home.overallGrade');
  });

  it('resolves nested name/desc for en TIER_51', async () => {
    await i18n.changeLanguage('en');
    const copy = resolveOverallGradeTierCopy(i18n.t.bind(i18n), 'TIER_51');
    expect(copy.name).toBe('STAGE 1 TUNE');
    expect(copy.desc.length).toBeGreaterThan(0);
    await i18n.changeLanguage('zh-Hant');
  });
});
