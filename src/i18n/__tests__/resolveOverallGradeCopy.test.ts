import { describe, expect, it, beforeAll } from 'vitest';
import i18n from '../../i18n';
import {
  buildOverallGradeDetailRows,
  resolveOverallGradeTierCopy,
} from '../resolveOverallGradeCopy';

describe('resolveOverallGradeTierCopy', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  it('resolves nested name/desc and vehicle benchmark for zh-Hant TIER_90', () => {
    const copy = resolveOverallGradeTierCopy(i18n.t.bind(i18n), 'TIER_90');
    expect(copy.name).toContain('UNLIMITED ATTACK');
    expect(copy.desc).toContain('極限馬力');
    expect(copy.representativeCar).toContain('Flat-6 NA');
    expect(copy.carPrice).toContain('600 萬');
    expect(copy.name).not.toContain('home.overallGrade');
  });

  it('resolves Mid-Engine benchmark row for zh-Hant TIER_80', () => {
    const copy = resolveOverallGradeTierCopy(i18n.t.bind(i18n), 'TIER_80');
    expect(copy.representativeCar).toContain('Mid-Engine');
    expect(copy.carPrice).toContain('450 萬');
  });

  it('resolves nested name/desc for en TIER_50', async () => {
    await i18n.changeLanguage('en');
    const copy = resolveOverallGradeTierCopy(i18n.t.bind(i18n), 'TIER_50');
    expect(copy.name).toBe('STAGE 1 TUNE');
    expect(copy.desc.length).toBeGreaterThan(0);
    expect(copy.representativeCar).toContain('Inline-4 Turbo');
    await i18n.changeLanguage('zh-Hant');
  });

  it('buildOverallGradeDetailRows returns labeled vehicle rows', () => {
    const copy = resolveOverallGradeTierCopy(i18n.t.bind(i18n), 'TIER_90');
    const rows = buildOverallGradeDetailRows(i18n.t.bind(i18n), 'TIER_90', copy);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.label).toContain('結構');
    expect(rows[0]?.value).toContain('Flat-6 NA');
    expect(rows[1]?.label).toContain('身價');
    expect(rows[1]?.value).toContain('600 萬');
  });

  it('buildOverallGradeDetailRows omits empty vehicle fields', () => {
    const rows = buildOverallGradeDetailRows(i18n.t.bind(i18n), 'TIER_90', {
      representativeCar: '',
      carPrice: '600 萬級',
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.value).toContain('600 萬');
  });
});
