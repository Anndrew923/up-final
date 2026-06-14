import { describe, expect, it } from 'vitest';
import i18n from '../../../i18n';
import {
  DYNO_SCORING_METHODOLOGY_CATALOG,
  DYNO_SCORING_METHODOLOGY_METRIC_IDS,
} from '../dynoIntelScoringMethodologyCatalog';
import { resolveDynoIntelScoringMethodologyBriefs } from '../resolveDynoIntelScoringMethodologyBriefs';

const EXPECTED_METHODOLOGY_METRICS = [
  'strength',
  'explosivePower',
  'cardio',
  'muscleMass',
  'bodyFat',
  'gripStrength',
  'armSize',
  'cooper',
  '5km',
] as const;

describe('dynoIntelScoringMethodologyCatalog', () => {
  it('keeps catalog metrics aligned with the canonical nine-metric list', () => {
    expect(DYNO_SCORING_METHODOLOGY_METRIC_IDS).toEqual([...EXPECTED_METHODOLOGY_METRICS]);
    expect(DYNO_SCORING_METHODOLOGY_CATALOG.map((entry) => entry.metric)).toEqual([
      ...EXPECTED_METHODOLOGY_METRICS,
    ]);
  });
});

describe('resolveDynoIntelScoringMethodologyBriefs', () => {
  it('resolves all catalog i18n keys in zh-Hant', async () => {
    await i18n.changeLanguage('zh-Hant');
    const t = i18n.t.bind(i18n);

    for (const entry of DYNO_SCORING_METHODOLOGY_CATALOG) {
      expect(t(entry.titleKey)).not.toBe(entry.titleKey);
      for (const bodyKey of entry.bodyKeys) {
        expect(t(bodyKey)).not.toBe(bodyKey);
      }
    }
  });

  it('resolves all catalog i18n keys in English', async () => {
    await i18n.changeLanguage('en');
    const t = i18n.t.bind(i18n);

    for (const entry of DYNO_SCORING_METHODOLOGY_CATALOG) {
      expect(t(entry.titleKey)).not.toBe(entry.titleKey);
      for (const bodyKey of entry.bodyKeys) {
        expect(t(bodyKey)).not.toBe(bodyKey);
      }
    }
  });

  it('resolves nine methodology briefs in zh-Hant with Brzycki/DOTS copy for strength', async () => {
    await i18n.changeLanguage('zh-Hant');
    const briefs = resolveDynoIntelScoringMethodologyBriefs(i18n.t.bind(i18n));

    expect(briefs).toHaveLength(DYNO_SCORING_METHODOLOGY_CATALOG.length);
    expect(briefs.map((b) => b.metric)).toEqual([...EXPECTED_METHODOLOGY_METRICS]);

    const strength = briefs.find((b) => b.metric === 'strength');
    expect(strength?.title.length).toBeGreaterThan(0);
    expect(strength?.body).toMatch(/Brzycki/);
    expect(strength?.body).toMatch(/DOTS/);
    expect(strength?.body).toMatch(/McCulloch/);

    const cooper = briefs.find((b) => b.metric === 'cooper');
    expect(cooper?.body).toMatch(/4900/);
    expect(cooper?.body).toMatch(/4400/);
  });

  it('resolves nine methodology briefs in English', async () => {
    await i18n.changeLanguage('en');
    const briefs = resolveDynoIntelScoringMethodologyBriefs(i18n.t.bind(i18n));

    expect(briefs).toHaveLength(DYNO_SCORING_METHODOLOGY_CATALOG.length);
    expect(briefs.map((b) => b.metric)).toEqual([...EXPECTED_METHODOLOGY_METRICS]);
  });
});
