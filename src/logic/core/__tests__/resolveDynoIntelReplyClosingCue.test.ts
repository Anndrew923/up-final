import { describe, expect, it } from 'vitest';
import i18n from '../../../i18n';
import { enrichDynoIntelContextCardCopy } from '../enrichDynoIntelContextCardCopy';
import { buildDynoIntelContext } from '../buildDynoIntelContext';
import { resolveDynoIntelReplyClosingCue } from '../resolveDynoIntelReplyClosingCue';
import type { PhysicalProfile } from '../../../types/userProfile';

const baseProfile: PhysicalProfile = {
  gender: 'male',
  age: 28,
  heightCm: 175,
  weightKg: 80,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('resolveDynoIntelReplyClosingCue', () => {
  it('prefers momentum-up cue when history shows positive delta', async () => {
    await i18n.changeLanguage('zh-Hant');
    const t = i18n.t.bind(i18n);

    const base = buildDynoIntelContext({
      radarInput: {
        scores: { strength: 85, cardio: 70 },
        profile: baseProfile,
        cardioInputs: null,
        muscleInputs: null,
        powerInputs: null,
        strengthInputs: null,
        gripInputs: null,
      },
      historyRecords: [
        {
          createdAt: '2026-02-01T00:00:00.000Z',
          scores: { strength: 85, cardio: 70 },
          overallScore: 77,
        },
        {
          createdAt: '2026-01-01T00:00:00.000Z',
          scores: { strength: 78, cardio: 70 },
          overallScore: 74,
        },
      ],
      locale: 'zh-Hant',
      mode: 'single-axis',
      focusAxis: 'strength',
    });

    const enriched = enrichDynoIntelContextCardCopy(base, t);
    expect(enriched.replyClosingCue).toMatch(/推進 7 分/);
  });

  it('prefers focus-axis momentum even when another axis delta is larger', async () => {
    await i18n.changeLanguage('zh-Hant');
    const t = i18n.t.bind(i18n);

    const base = buildDynoIntelContext({
      radarInput: {
        scores: { strength: 82, cardio: 95 },
        profile: baseProfile,
        cardioInputs: null,
        muscleInputs: null,
        powerInputs: null,
        strengthInputs: null,
        gripInputs: null,
      },
      historyRecords: [
        {
          createdAt: '2026-02-01T00:00:00.000Z',
          scores: { strength: 82, cardio: 95 },
          overallScore: 88,
        },
        {
          createdAt: '2026-01-01T00:00:00.000Z',
          scores: { strength: 80, cardio: 70 },
          overallScore: 75,
        },
      ],
      locale: 'zh-Hant',
      mode: 'single-axis',
      focusAxis: 'strength',
    });

    const enriched = enrichDynoIntelContextCardCopy(base, t);
    expect(enriched.replyClosingCue).toMatch(/推進 2 分/);
    expect(enriched.replyClosingCue).toMatch(/力量/);
  });

  it('uses high-tier cue when tier is LEGEND and no positive momentum', async () => {
    await i18n.changeLanguage('zh-Hant');
    const t = i18n.t.bind(i18n);

    const base = buildDynoIntelContext({
      radarInput: {
        scores: { strength: 155 },
        profile: baseProfile,
        cardioInputs: null,
        muscleInputs: null,
        powerInputs: null,
        strengthInputs: null,
        gripInputs: null,
      },
      historyRecords: [],
      locale: 'zh-Hant',
      mode: 'single-axis',
      focusAxis: 'strength',
    });

    const enriched = enrichDynoIntelContextCardCopy(base, t);
    expect(enriched.replyClosingCue).toMatch(/級距已被主機封存/);
  });

  it('uses weakest-companion cue on low focus-axis score', async () => {
    await i18n.changeLanguage('zh-Hant');
    const t = i18n.t.bind(i18n);

    const base = buildDynoIntelContext({
      radarInput: {
        scores: { strength: 45, cardio: 80 },
        profile: baseProfile,
        cardioInputs: null,
        muscleInputs: null,
        powerInputs: null,
        strengthInputs: null,
        gripInputs: null,
      },
      historyRecords: [],
      locale: 'zh-Hant',
      mode: 'single-axis',
      focusAxis: 'strength',
    });

    const enriched = enrichDynoIntelContextCardCopy(base, t);
    expect(enriched.replyClosingCue).toMatch(/最弱鏈路/);
  });

  it('resolves all replyClosingCue i18n keys in both locales', async () => {
    for (const locale of ['zh-Hant', 'en'] as const) {
      await i18n.changeLanguage(locale);
      const t = i18n.t.bind(i18n);
      for (const key of ['default', 'momentumUp', 'highTier', 'weakestCompanion'] as const) {
        const resolved = t(`dynoIntel.replyClosingCue.${key}`, {
          axisLabel: 'test',
          delta: '1',
          tierTitle: 'test',
        });
        expect(resolved).not.toBe(`dynoIntel.replyClosingCue.${key}`);
      }
    }
  });

  it('falls back to default when no special telemetry signal', async () => {
    await i18n.changeLanguage('en');
    const t = i18n.t.bind(i18n);

    const base = buildDynoIntelContext({
      radarInput: {
        scores: { strength: 72, cardio: 68 },
        profile: baseProfile,
        cardioInputs: null,
        muscleInputs: null,
        powerInputs: null,
        strengthInputs: null,
        gripInputs: null,
      },
      historyRecords: [],
      locale: 'en',
      mode: 'cross-axis',
    });

    const enriched = enrichDynoIntelContextCardCopy(base, t);
    expect(enriched.replyClosingCue.length).toBeGreaterThan(0);
    expect(resolveDynoIntelReplyClosingCue(enriched, t)).toBe(enriched.replyClosingCue);
  });
});
