import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GRIP_CENTURY_SCORE } from '../../core/gripStrength';
import {
  AESTHETIC_OVERFLOW_BF_THRESHOLDS,
  formatAestheticBattleCode,
  parseAestheticBodyFatPct,
  resolveAestheticBodyFatPct,
  resolveAestheticSpec,
  resolveOverflowBfState,
  resolveVisualScore,
} from '../aestheticResolver';
import {
  DECADE_BAND_IDS,
  OVERALL_TITLE_IDS,
  VISUAL_SPEC_IDS,
} from '../aestheticTypes';
import zhAesthetic from '../../../i18n/locales/zh-Hant/common/aesthetic.json';
import enAesthetic from '../../../i18n/locales/en/common/aesthetic.json';

function collectStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === 'string') {
    acc.push(value);
    return acc;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, acc);
    return acc;
  }
  if (value && typeof value === 'object') {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      collectStrings(nested, acc);
    }
  }
  return acc;
}

describe('resolveVisualScore', () => {
  it('applies assassin 60/40 weighting for the locked coach fixture', () => {
    expect(resolveVisualScore({ bodyFat: 75.57, muscleMass: 96.79 })).toBe(88.3);
  });
});

describe('resolveAestheticSpec', () => {
  it('pins assassin above marble when visualScore is in the 80s', () => {
    const result = resolveAestheticSpec({
      overallScore: 80,
      gender: 'male',
      bodyFatPct: 8,
      peakKg: null,
      scores: { bodyFat: 75.57, muscleMass: 96.79 },
    });
    expect(result.visual.score).toBe(88.3);
    expect(result.visual.id).toBe('assassin');
    expect(result.visual.unmeasured).toBe(false);
    expect(result.visual.bodyFatMissing).toBe(false);
  });

  it('splits female 80-band titles by body-fat and missing-BF defense', () => {
    const base = {
      overallScore: 85,
      gender: 'female' as const,
      peakKg: null,
      scores: { bodyFat: 85 },
    };
    expect(resolveAestheticSpec({ ...base, bodyFatPct: 18 }).visual.id).toBe('chiseledWaist');
    expect(resolveAestheticSpec({ ...base, bodyFatPct: 22 }).visual.id).toBe('goldenHourglass');
    expect(resolveAestheticSpec({ ...base, bodyFatPct: 26 }).visual.id).toBe('curvyPower');
    const missing = resolveAestheticSpec({ ...base, bodyFatPct: null });
    expect(missing.visual.id).toBe('curvyPower');
    expect(missing.visual.bodyFatMissing).toBe(true);
  });

  it('does not fire assassin below visualScore 80 even with shredded BF', () => {
    const result = resolveAestheticSpec({
      overallScore: 70,
      gender: 'male',
      bodyFatPct: 8,
      peakKg: null,
      scores: { bodyFat: 70, muscleMass: 85 },
    });
    expect(result.visual.score).toBe(79);
    expect(result.visual.id).not.toBe('assassin');
    expect(result.visual.id).toBe('athleticFrame');
  });

  it('routes a female assassin-channel physique to huntress', () => {
    const result = resolveAestheticSpec({
      overallScore: 85,
      gender: 'female',
      bodyFatPct: 16,
      peakKg: null,
      scores: { bodyFat: 84, muscleMass: 85 },
    });
    expect(result.visual.id).toBe('huntress');
  });

  it.each([
    [140, 7, 'male', 'pantheonApexDry'],
    [140, 13, 'male', 'pantheonApex'],
    [140, 18, 'male', 'pantheonColossus'],
    [140, 14, 'female', 'pantheonApexDryF'],
    [140, 18, 'female', 'pantheonApexF'],
    [140, 24, 'female', 'pantheonColossusF'],
    [135, 7, 'male', 'titanDryGod'],
    [135, 13, 'male', 'titanTemple'],
    [135, 18, 'male', 'colossusWall'],
    [135, 14, 'female', 'valkyrieDryGoddess'],
    [135, 18, 'female', 'valkyrieApex'],
    [135, 24, 'female', 'colossusShield'],
    [125, 7, 'male', 'historicDryGod'],
    [125, 13, 'male', 'historicBeast'],
    [125, 18, 'male', 'unshakableWall'],
    [125, 14, 'female', 'historicDryGoddess'],
    [125, 18, 'female', 'historicAmazonian'],
    [125, 24, 'female', 'unshakableShield'],
    [115, 7, 'male', 'transcendentDry'],
    [115, 13, 'male', 'transcendentTitan'],
    [115, 18, 'male', 'ironFortress'],
    [115, 14, 'female', 'transcendentDryF'],
    [115, 18, 'female', 'valkyrieTranscendent'],
    [115, 24, 'female', 'ironFortressF'],
    [105, 7, 'male', 'awakenedDryGod'],
    [105, 13, 'male', 'awakenedGodform'],
    [105, 18, 'male', 'heavyTitan'],
    [105, 14, 'female', 'athenaDryGod'],
    [105, 18, 'female', 'athenaAwakened'],
    [105, 24, 'female', 'heavyAmazonian'],
  ] as const)(
    'overflow visualScore=%s bf=%s %s → %s',
    (score, bodyFatPct, gender, id) => {
      const result = resolveAestheticSpec({
        overallScore: score,
        gender,
        bodyFatPct,
        peakKg: null,
        scores: { bodyFat: score },
      });
      expect(result.visual.score).toBe(score);
      expect(result.visual.id).toBe(id);
    }
  );

  it('sends 100-band missing BF to heavyTitan, never carved or godform titles', () => {
    const result = resolveAestheticSpec({
      overallScore: 105,
      gender: 'male',
      bodyFatPct: null,
      peakKg: null,
      scores: { bodyFat: 105 },
    });
    expect(result.visual.score).toBe(105);
    expect(result.visual.id).toBe('heavyTitan');
    expect(result.visual.id).not.toBe('colossusWall');
    expect(result.visual.id).not.toBe('awakenedDryGod');
    expect(result.visual.id).not.toBe('awakenedGodform');
  });

  it('caps assassin below 100 so overflow shredded high-SMM lands in transcendentDry', () => {
    const result = resolveAestheticSpec({
      overallScore: 110,
      gender: 'male',
      bodyFatPct: 7,
      peakKg: null,
      scores: { bodyFat: 80, muscleMass: 140 },
    });
    // Equal-mean 110: 60/40 weighting only applies when FFMI score is strictly below 80.
    expect(result.visual.score).toBe(110);
    expect(result.visual.id).toBe('transcendentDry');
    expect(result.visual.id).not.toBe('assassin');
  });

  it('classifies overflow BF at shredded / athletic / colossus edges', () => {
    const male = AESTHETIC_OVERFLOW_BF_THRESHOLDS.male;
    const female = AESTHETIC_OVERFLOW_BF_THRESHOLDS.female;
    expect(resolveOverflowBfState('male', male.shreddedMax - 0.01)).toBe('shredded');
    expect(resolveOverflowBfState('male', male.shreddedMax)).toBe('athletic');
    expect(resolveOverflowBfState('male', male.athleticMax - 0.01)).toBe('athletic');
    expect(resolveOverflowBfState('male', male.athleticMax)).toBe('colossus');
    expect(resolveOverflowBfState('male', null)).toBe('colossus');
    expect(resolveOverflowBfState('female', female.shreddedMax - 0.01)).toBe('shredded');
    expect(resolveOverflowBfState('female', female.shreddedMax)).toBe('athletic');
    expect(resolveOverflowBfState('female', female.athleticMax - 0.01)).toBe('athletic');
    expect(resolveOverflowBfState('female', female.athleticMax)).toBe('colossus');
  });

  it('sends male 90-band missing BF to titanColossus, never marble', () => {
    const result = resolveAestheticSpec({
      overallScore: 95,
      gender: 'male',
      bodyFatPct: null,
      peakKg: null,
      scores: { bodyFat: 95 },
    });
    expect(result.visual.id).toBe('titanColossus');
    expect(result.visual.id).not.toBe('marbleChiseled');
    expect(result.visual.bodyFatMissing).toBe(true);
  });

  it('averages only present force axes and returns null when all three are missing', () => {
    const partial = resolveAestheticSpec({
      overallScore: 70,
      gender: 'male',
      bodyFatPct: 15,
      peakKg: null,
      scores: { strength: 80, gripStrength: 90 },
    });
    expect(partial.force.score).toBe(85);
    expect(partial.force.unmeasured).toBe(false);

    const empty = resolveAestheticSpec({
      overallScore: 40,
      gender: 'male',
      bodyFatPct: 15,
      peakKg: null,
      scores: {},
    });
    expect(empty.force.score).toBeNull();
    expect(empty.force.unmeasured).toBe(true);
  });

  it('unlocks titan grip at the century score even without peakKg', () => {
    const result = resolveAestheticSpec({
      overallScore: 90,
      gender: 'female',
      bodyFatPct: 20,
      peakKg: null,
      scores: { gripStrength: GRIP_CENTURY_SCORE },
    });
    expect(result.hasTitanGrip).toBe(true);
    expect(result.peakKg).toBeNull();
  });

  it('marks all three columns unmeasured when gender is missing', () => {
    const result = resolveAestheticSpec({
      overallScore: 88,
      gender: null,
      bodyFatPct: 12,
      peakKg: 70,
      scores: { bodyFat: 90, muscleMass: 90, strength: 90, cardio: 90 },
    });
    expect(result.visual.unmeasured).toBe(true);
    expect(result.force.unmeasured).toBe(true);
    expect(result.kinetic.unmeasured).toBe(true);
    expect(result.visual.id).toBeNull();
  });
});

describe('aesthetic copy isolation', () => {
  it('keeps zh-Hant aesthetic copy free of vehicle industrial terms', () => {
    const banned = /馬力|進氣|扭矩|底盤|增壓|排量|車體/;
    const disk = readFileSync(
      resolve(process.cwd(), 'src/i18n/locales/zh-Hant/common/aesthetic.json'),
      'utf8'
    );
    expect(disk).not.toMatch(banned);
    for (const line of collectStrings(zhAesthetic)) {
      expect(line).not.toMatch(banned);
    }
  });

  it('keeps en aesthetic copy free of chassis / drivetrain / turbo wording', () => {
    const banned = /chassis|drivetrain|turbo|horsepower|displacement|\bengine\b|\bmechanical\b/i;
    for (const line of collectStrings(enAesthetic)) {
      expect(line).not.toMatch(banned);
    }
  });

  it('keeps locale visual / overall / decade keys aligned with resolver ids', () => {
    const zh = zhAesthetic.aesthetic;
    const en = enAesthetic.aesthetic;
    expect(Object.keys(zh.visual).sort()).toEqual([...VISUAL_SPEC_IDS].sort());
    expect(Object.keys(en.visual).sort()).toEqual([...VISUAL_SPEC_IDS].sort());
    expect(Object.keys(zh.overall).sort()).toEqual([...OVERALL_TITLE_IDS].sort());
    expect(Object.keys(en.overall).sort()).toEqual([...OVERALL_TITLE_IDS].sort());
    const decadeKeys = [...DECADE_BAND_IDS].sort();
    expect(Object.keys(zh.force.m).sort()).toEqual(decadeKeys);
    expect(Object.keys(zh.force.f).sort()).toEqual(decadeKeys);
    expect(Object.keys(zh.kinetic.m).sort()).toEqual(decadeKeys);
    expect(Object.keys(zh.kinetic.f).sort()).toEqual(decadeKeys);
    expect(Object.keys(en.force.m).sort()).toEqual(decadeKeys);
    expect(Object.keys(en.kinetic.f).sort()).toEqual(decadeKeys);
    for (const id of VISUAL_SPEC_IDS) {
      // WHY: Spec card HUD budgets visual titles at <=15 code units in both locales; keep the
      // gate in-repo so copy polish cannot silently reintroduce overflow.
      expect(zh.visual[id].title.trim().length, id).toBeGreaterThan(0);
      expect(zh.visual[id].title.trim().length, id).toBeLessThanOrEqual(15);
      expect(zh.visual[id].subtitle.trim().length, id).toBeGreaterThan(0);
      expect(en.visual[id].title.trim().length, id).toBeGreaterThan(0);
      expect(en.visual[id].title.trim().length, id).toBeLessThanOrEqual(15);
      expect(en.visual[id].subtitle.trim().length, id).toBeGreaterThan(0);
    }
    for (const bandId of DECADE_BAND_IDS) {
      // WHY: Force/kinetic titles share the SpecRow title budget; clamp zh+en ladder copy.
      for (const locale of [
        ['zh', zh],
        ['en', en],
      ] as const) {
        const [localeId, pack] = locale;
        for (const kind of ['force', 'kinetic'] as const) {
          for (const gender of ['m', 'f'] as const) {
            const path = `${localeId}.${kind}.${gender}.${bandId}`;
            expect(pack[kind][gender][bandId].title.trim().length, path).toBeGreaterThan(0);
            expect(pack[kind][gender][bandId].title.trim().length, path).toBeLessThanOrEqual(15);
            expect(pack[kind][gender][bandId].subtitle.trim().length, path).toBeGreaterThan(0);
          }
        }
      }
    }
    expect(zh.labels.bodyFatValue).toContain('{{bf}}');
    expect(en.labels.bodyFatValue).toContain('{{bf}}');
    expect(zh.labels.overflowBadge).toBe('超限');
    expect(en.labels.overflowBadge).toBe('OVERDRIVE');
    expect(zh.labels.titanBadge).toBe('泰坦認證');
    expect(en.labels.titanBadge).toBe('TITAN VERIFIED');
    expect(zh.labels.unmeasured).toBe('待檢測');
    expect(en.labels.unmeasured).toBe('Not measured');
    expect(zh).not.toHaveProperty('titanGrip');
    expect(en).not.toHaveProperty('titanGrip');
    expect(zh.labels.gripKgValue).toContain('{{peakKg}}');
    expect(en.labels.gripKgValue).toContain('{{peakKg}}');
    expect(zh.labels.verifiedStamp).toContain('{{year}}');
    expect(en.labels.verifiedStamp).toContain('{{year}}');
    expect(zh.labels.triggerCta).toBe('調閱生理規格證書');
    expect(en.labels.triggerCta).toBe('View Spec Certificate');
    expect(zh.labels.triggerCtaShort).toBe('規格證書');
    expect(en.labels.triggerCtaShort).toBe('Certificate');
    expect(zh.labels.visualLineWithNote).toContain('{{subtitle}}');
    expect(zh.labels.visualLineWithNote).toContain('{{note}}');
    expect(en.labels.visualLineWithNote).toContain('{{subtitle}}');
    expect(en.labels.visualLineWithNote).toContain('{{note}}');
    expect(en.visual.assassin.subtitle).toBe('LOOKS CAN KILL');
    expect(en.force.m['110'].subtitle).toBe('UNREAL TRAINING WEIGHT · GYM BROS STARING IN SHOCK');
    expect(en.kinetic.m['100'].subtitle).toBe('TIRED IS NOT IN VOCABULARY · HOPELESS GAP FOR RIVALS');
    expect(en.kinetic.m['90'].title).toBe('SCARY STAMINA');
    expect(en.labels.brandHeader).toBe('UP // DOMINANCE:');
    expect(en.labels.brandHeader.length).toBeLessThanOrEqual(16);
    expect(en.labels.forceMetric).toBe('RIGID BURST');
    expect(en.labels.kineticMetric).toBe('PEAK STAMINA');
    for (const key of ['visualMetric', 'forceMetric', 'kineticMetric', 'gripMetric'] as const) {
      expect(en.labels[key].length, key).toBeLessThanOrEqual(12);
    }
    for (const id of OVERALL_TITLE_IDS) {
      expect(en.overall[id]).toBe(en.overall[id].toUpperCase());
      expect(en.overall[id].length, id).toBeLessThanOrEqual(15);
    }
    expect(en.labels.visual).toBe('VISUAL TENSION');
    expect(en.labels.force).toBe('ABSOLUTE RIGIDITY');
    expect(en.labels.kinetic).toBe('PRIMAL DRIVE');
    for (const line of collectStrings(en)) {
      const stripped = line.replace(/\{\{[^}]+\}\}/g, ' ');
      for (const word of stripped.split(/[^A-Za-z]+/).filter(Boolean)) {
        expect(word.length, word).toBeLessThanOrEqual(15);
      }
    }
  });
});

describe('aesthetic input helpers', () => {
  it('parses stored body-fat strings and rejects out-of-band values', () => {
    expect(parseAestheticBodyFatPct(12.5)).toBe(12.5);
    expect(parseAestheticBodyFatPct('12,5')).toBe(12.5);
    expect(parseAestheticBodyFatPct(1)).toBeNull();
    expect(parseAestheticBodyFatPct('nope')).toBeNull();
  });

  it('resolves body-fat from FFMI draft before arm size before history', () => {
    expect(
      resolveAestheticBodyFatPct({
        ffmiDraftPct: 12.5,
        armSizePct: 18,
        latestHistoryFfmiPct: 22,
      })
    ).toBe(12.5);
    expect(
      resolveAestheticBodyFatPct({
        ffmiDraftPct: null,
        armSizePct: 18,
        latestHistoryFfmiPct: 22,
      })
    ).toBe(18);
    expect(
      resolveAestheticBodyFatPct({
        ffmiDraftPct: null,
        armSizePct: null,
        latestHistoryFfmiPct: 22,
      })
    ).toBe(22);
    expect(
      resolveAestheticBodyFatPct({
        ffmiDraftPct: null,
        armSizePct: null,
        latestHistoryFfmiPct: null,
      })
    ).toBeNull();
  });

  it('formats battle code with and without a uid tail', () => {
    expect(formatAestheticBattleCode('Bruce', 'abcxyz1234')).toBe('UP-Bruce #1234');
    expect(formatAestheticBattleCode('  安  德  ', null)).toBe('UP-安 德');
  });
});
