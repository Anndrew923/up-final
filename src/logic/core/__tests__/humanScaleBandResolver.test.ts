import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import {
  getPopulationClassI18nKey,
  resolveDecadeKeyFromBandId,
  resolveDecadeKeyFromScore,
  resolveHumanScaleBandMeta,
  resolveHumanScaleMetaFromBandId,
  translatePopulationClass,
} from '../humanScaleBandResolver';
import decadeParity from '../fixtures/humanScaleDecadeParity.json';

describe('resolveDecadeKeyFromBandId', () => {
  it('locks bandId → decadeKey parity table with Cloud Functions', () => {
    for (const [bandId, decadeKey] of decadeParity.bandIdToDecade) {
      expect(resolveDecadeKeyFromBandId(bandId)).toBe(decadeKey);
    }
  });

  it('maps BASE to 0', () => {
    expect(resolveDecadeKeyFromBandId('BASE')).toBe('0');
  });

  it('maps decade TIER_* bands to matching decade keys', () => {
    expect(resolveDecadeKeyFromBandId('TIER_40')).toBe('40');
    expect(resolveDecadeKeyFromBandId('TIER_80')).toBe('80');
    expect(resolveDecadeKeyFromBandId('TIER_140')).toBe('140');
  });

  it('collapses LEGEND and PANTHEON to 150', () => {
    expect(resolveDecadeKeyFromBandId('LEGEND')).toBe('150');
    expect(resolveDecadeKeyFromBandId('PANTHEON')).toBe('150');
  });

  it('falls back to 0 for unknown band ids', () => {
    expect(resolveDecadeKeyFromBandId('')).toBe('0');
    expect(resolveDecadeKeyFromBandId('UNKNOWN')).toBe('0');
  });
});

describe('resolveDecadeKeyFromScore', () => {
  it('aligns score boundaries with decade gates', () => {
    expect(resolveDecadeKeyFromScore('strength', 39.99)).toBe('0');
    expect(resolveDecadeKeyFromScore('strength', 40)).toBe('40');
    expect(resolveDecadeKeyFromScore('strength', 69.99)).toBe('60');
    expect(resolveDecadeKeyFromScore('strength', 70)).toBe('70');
    expect(resolveDecadeKeyFromScore('strength', 87.8)).toBe('80');
    expect(resolveDecadeKeyFromScore('strength', 149.99)).toBe('140');
    expect(resolveDecadeKeyFromScore('strength', 150)).toBe('150');
    expect(resolveDecadeKeyFromScore('strength', 180)).toBe('150');
  });

  it('keeps grip pantheon collapse at 160 → 150 decade', () => {
    expect(resolveDecadeKeyFromScore('gripStrength', 159.99)).toBe('150');
    expect(resolveDecadeKeyFromScore('gripStrength', 160)).toBe('150');
  });
});

describe('translatePopulationClass', () => {
  it('builds i18n key path for decade', () => {
    expect(getPopulationClassI18nKey('80')).toBe(
      'dynoIntel.humanPraise.byDecade.80.populationClass'
    );
  });

  it('resolves via t() and falls back to decade 0 when missing', () => {
    const t = ((key: string) => {
      if (key === 'dynoIntel.humanPraise.byDecade.80.populationClass') return '高階玩家';
      if (key === 'dynoIntel.humanPraise.byDecade.0.populationClass') return '嬰兒期';
      return key;
    }) as TFunction;

    expect(translatePopulationClass(t, '80')).toBe('高階玩家');
    expect(translatePopulationClass(t, '999')).toBe('嬰兒期');
  });

  it('resolveHumanScaleMetaFromBandId derives decade + class without re-walking score bands', () => {
    const t = ((key: string) => {
      if (key === 'dynoIntel.humanPraise.byDecade.80.populationClass') return '高階玩家';
      return key;
    }) as TFunction;

    expect(resolveHumanScaleMetaFromBandId(t, 'TIER_80')).toEqual({
      decadeKey: '80',
      populationClass: '高階玩家',
    });
  });

  it('resolveHumanScaleBandMeta returns band + decade + class together', () => {
    const t = ((key: string) => {
      if (key === 'dynoIntel.humanPraise.byDecade.80.populationClass') return '高階玩家';
      return key;
    }) as TFunction;

    expect(resolveHumanScaleBandMeta(t, 'strength', 87.8)).toEqual({
      bandId: 'TIER_80',
      decadeKey: '80',
      populationClass: '高階玩家',
    });
  });
});
