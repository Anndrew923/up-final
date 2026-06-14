import { describe, expect, it } from 'vitest';
import i18n from '../../../i18n';
import { buildDynoIntelContext } from '../buildDynoIntelContext';
import { enrichDynoIntelContextCardCopy } from '../enrichDynoIntelContextCardCopy';
import type { PhysicalProfile } from '../../../types/userProfile';

const baseProfile: PhysicalProfile = {
  gender: 'male',
  age: 28,
  heightCm: 175,
  weightKg: 80,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('enrichDynoIntelContextCardCopy', () => {
  it('enriches six-axis and supplemental cardCopy from i18n', async () => {
    await i18n.changeLanguage('zh-Hant');
    const t = i18n.t.bind(i18n);

    const base = buildDynoIntelContext({
      radarInput: {
        scores: { strength: 85, armSize: 130 },
        profile: baseProfile,
        cardioInputs: { cardio: { distance: 2800 } },
        muscleInputs: null,
        powerInputs: null,
        strengthInputs: null,
        gripInputs: null,
      },
      historyRecords: [],
      locale: 'zh-Hant',
      mode: 'single-axis',
      focusSupplemental: 'armSize',
    });

    const enriched = enrichDynoIntelContextCardCopy(base, t);
    const strength = enriched.axes.find((a) => a.axis === 'strength');
    const armSize = enriched.supplementalMetrics.find((m) => m.metric === 'armSize');
    const cooper = enriched.supplementalMetrics.find((m) => m.metric === 'cooper');

    expect(strength?.cardCopy?.title.length).toBeGreaterThan(0);
    expect(strength?.cardCopy?.summary.length).toBeGreaterThan(0);
    expect(armSize?.cardCopy?.title.length).toBeGreaterThan(0);
    expect(cooper?.cardCopy?.title.length).toBeGreaterThan(0);
    expect(enriched.scoringMethodologyBriefs.length).toBe(9);
    expect(enriched.scoringMethodologyBriefs.find((b) => b.metric === 'strength')?.body).toMatch(
      /Brzycki/
    );
    expect(enriched.assessmentDeepDiveNudge.length).toBeGreaterThan(0);
    expect(enriched.assessmentDeepDiveNudge).toMatch(/評測頁/);
    expect(enriched.replyClosingCue.length).toBeGreaterThan(0);
  });
});
