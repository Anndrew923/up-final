import { describe, expect, it } from 'vitest';
import i18n from '../../../i18n';
import { buildDynoIntelContext } from '../buildDynoIntelContext';
import { enrichDynoIntelContextCardCopy } from '../enrichDynoIntelContextCardCopy';
import {
  resolveClosingBeatVariantIndex,
  resolveDynoIntelClosingBeatKind,
} from '../resolveDynoIntelClosingBeatKind';
import type { PhysicalProfile } from '../../../types/userProfile';

const baseProfile: PhysicalProfile = {
  gender: 'male',
  age: 28,
  heightCm: 175,
  weightKg: 80,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('resolveDynoIntelClosingBeatKind', () => {
  it('uses methodology-nudge for scoring methodology questions', async () => {
    await i18n.changeLanguage('zh-Hant');
    const t = i18n.t.bind(i18n);

    const base = buildDynoIntelContext({
      radarInput: {
        scores: { bodyFat: 96 },
        profile: baseProfile,
        cardioInputs: null,
        muscleInputs: null,
        powerInputs: null,
        strengthInputs: null,
        gripInputs: null,
      },
      historyRecords: [],
      locale: 'zh-Hant',
      mode: 'cross-axis',
    });

    const enriched = enrichDynoIntelContextCardCopy(base, t, 'FFMI 公式怎麼算？');
    expect(enriched.closingBeatKind).toBe('methodology-nudge');
    expect(enriched.closingBeatSecondLine).toBe(enriched.assessmentDeepDiveNudge);
  });

  it('uses passion-close or return-ritual for status questions', async () => {
    await i18n.changeLanguage('zh-Hant');
    const generatedAt = '2026-06-14T12:00:00.000Z';

    const kind = resolveDynoIntelClosingBeatKind('我的 FFMI 狀態如何？', { generatedAt });
    expect(['passion-close', 'return-ritual']).toContain(kind);
    expect(resolveClosingBeatVariantIndex('我的 FFMI 狀態如何？', generatedAt)).toBeGreaterThanOrEqual(
      0
    );
  });

  it('resolves closingBeatSecondLine i18n keys in both locales', async () => {
    for (const locale of ['zh-Hant', 'en'] as const) {
      await i18n.changeLanguage(locale);
      const t = i18n.t.bind(i18n);
      for (const key of [
        'passionClose0',
        'passionClose1',
        'passionClose2',
        'returnRitual0',
        'returnRitual1',
        'returnRitual2',
      ] as const) {
        const resolved = t(`dynoIntel.closingBeatSecondLine.${key}`, {
          axisScore: '85',
          tierTitle: 'test',
        });
        expect(resolved).not.toBe(`dynoIntel.closingBeatSecondLine.${key}`);
      }
    }
  });
});
