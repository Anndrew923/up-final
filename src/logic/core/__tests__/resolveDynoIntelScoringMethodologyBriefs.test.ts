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
    // WHY: Cooper p5 is architecture-only — hard-coded distance ceilings must stay out of Dyno copy.
    expect(cooper?.body).toMatch(/極限距離上限|鎖定最高分/);
    expect(cooper?.body).not.toMatch(/4900/);
    expect(cooper?.body).not.toMatch(/4400/);
    expect(cooper?.body).not.toMatch(/\{\{maleCap\}\}/);

    const fiveKm = briefs.find((b) => b.metric === '5km');
    expect(fiveKm?.body).toMatch(/20:00/);
    expect(fiveKm?.body).toMatch(/12:20/);
    expect(fiveKm?.body).toMatch(/13:40/);
    expect(fiveKm?.body).not.toMatch(/\{\{maleFloor\}\}/);

    const grip = briefs.find((b) => b.metric === 'gripStrength');
    expect(grip?.body).toMatch(/IronMind/);
    expect(grip?.body).toMatch(/CoC/);
    expect(grip?.body).toMatch(/Magnus Samuelsson/);
    expect(grip?.body).toMatch(/雙段|精英基準線|200/);
    // WHY: Grip methodology must narrate architecture, never proprietary slope / W_factor constants.
    expect(grip?.body).not.toMatch(/1\.4/);
    expect(grip?.body).not.toMatch(/2\.24/);
    expect(grip?.body).not.toMatch(/W_factor/);
    expect(grip?.body).not.toMatch(/100\.8/);

    const muscle = briefs.find((b) => b.metric === 'muscleMass');
    expect(muscle?.body).toMatch(/Hafthor|魔山/);
    expect(muscle?.body).toMatch(/Ronnie Coleman|羅尼/);
    expect(muscle?.body).toMatch(/Nataliya|俄羅斯亞馬遜/);
    expect(muscle?.body).toMatch(/Iris Kyle|艾瑞斯/);
    expect(muscle?.body).toMatch(/100 kg/);
    expect(muscle?.body).toMatch(/67 kg/);
    expect(muscle?.body).toMatch(/高肌量動態權重/);
    expect(muscle?.body).not.toMatch(/巨獸加權/);
    expect(muscle?.body).not.toMatch(/\{\{maleMax\}\}/);
  });

  it('resolves nine methodology briefs in English', async () => {
    await i18n.changeLanguage('en');
    const briefs = resolveDynoIntelScoringMethodologyBriefs(i18n.t.bind(i18n));

    expect(briefs).toHaveLength(DYNO_SCORING_METHODOLOGY_CATALOG.length);
    expect(briefs.map((b) => b.metric)).toEqual([...EXPECTED_METHODOLOGY_METRICS]);

    const cooper = briefs.find((b) => b.metric === 'cooper');
    expect(cooper?.body).toMatch(/human-limit ceiling|maximum score/i);
    expect(cooper?.body).not.toMatch(/4900/);
    expect(cooper?.body).not.toMatch(/4400/);

    const grip = briefs.find((b) => b.metric === 'gripStrength');
    expect(grip?.body).toMatch(/IronMind/i);
    expect(grip?.body).toMatch(/CoC|Captains of Crush/i);
    expect(grip?.body).toMatch(/Magnus Samuelsson/);
    expect(grip?.body).toMatch(/dual-slope|elite benchmark|200/i);
    expect(grip?.body).not.toMatch(/1\.4/);
    expect(grip?.body).not.toMatch(/2\.24/);
    expect(grip?.body).not.toMatch(/W_factor/);
    expect(grip?.body).not.toMatch(/100\.8/);

    const muscle = briefs.find((b) => b.metric === 'muscleMass');
    expect(muscle?.body).toMatch(/Hafthor Bjornsson|The Mountain/i);
    expect(muscle?.body).toMatch(/Ronnie Coleman/);
    expect(muscle?.body).toMatch(/Nataliya Kuznetsova/i);
    expect(muscle?.body).toMatch(/Iris Kyle/i);
    expect(muscle?.body).toMatch(/100 kg/);
    expect(muscle?.body).toMatch(/67 kg/);
    expect(muscle?.body).toMatch(/high-mass dynamic weighting/i);
    expect(muscle?.body).not.toMatch(/80% SMM/);
    expect(muscle?.body).not.toMatch(/\{\{maleMax\}\}/);
  });
});
