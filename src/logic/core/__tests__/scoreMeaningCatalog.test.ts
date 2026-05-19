import { describe, expect, it } from 'vitest';
import enCore from '../../../i18n/locales/en/common/core.json';
import zhCore from '../../../i18n/locales/zh-Hant/common/core.json';
import { SIX_AXIS_METRICS } from '../../../types/scoring';
import enHome from '../../../i18n/locales/en/common/home.json';
import zhHome from '../../../i18n/locales/zh-Hant/common/home.json';
import {
  ARM_SIZE_SCORE_BANDS,
  EXPLOSIVE_SCORE_BANDS,
  OVERALL_SCORE_BANDS,
  resolveOverallGradeBand,
  resolveScoreBand,
  resolveScoreMeaningMilestone,
  SCORE_MEANING_CATALOG,
} from '../scoreMeaningCatalog';

type BandCopy = { title: string; summary: string };
type ScoreMeaningBands = Record<string, Record<string, BandCopy>>;

const enBands = (enCore as { scoreMeaning: { bands: ScoreMeaningBands } }).scoreMeaning.bands;
const zhBands = (zhCore as { scoreMeaning: { bands: ScoreMeaningBands } }).scoreMeaning.bands;

describe('resolveScoreBand(cardio)', () => {
  it('maps boundary and float gap around 41 correctly', () => {
    expect(resolveScoreBand('cardio', 40.0).id).toBe('BASE');
    expect(resolveScoreBand('cardio', 40.1).id).toBe('BASE');
    expect(resolveScoreBand('cardio', 40.9).id).toBe('BASE');
    expect(resolveScoreBand('cardio', 41.0).id).toBe('TIER_41');
  });

  it('maps overflow values to LEGEND', () => {
    expect(resolveScoreBand('cardio', 151.0).id).toBe('LEGEND');
    expect(resolveScoreBand('cardio', 160.0).id).toBe('LEGEND');
  });

  it('maps 5km-mid benchmark score 80 to TIER_81', () => {
    expect(resolveScoreBand('cardio', 79.9).id).toBe('TIER_71');
    expect(resolveScoreBand('cardio', 80.0).id).toBe('TIER_81');
  });

  it('maps zero to BASE', () => {
    expect(resolveScoreBand('cardio', 0).id).toBe('BASE');
  });

  it('bridges decimal gaps correctly around transitions', () => {
    expect(resolveScoreBand('cardio', 150.5).id).toBe('TIER_141');
  });
});

describe('resolveScoreBand(strength)', () => {
  it('keeps the full 13-tier racing spec map', () => {
    const ids = SCORE_MEANING_CATALOG.strength.map((band) => band.id);
    expect(ids).toEqual([
      'BASE',
      'TIER_41',
      'TIER_51',
      'TIER_61',
      'TIER_71',
      'TIER_81',
      'TIER_91',
      'TIER_101',
      'TIER_111',
      'TIER_121',
      'TIER_131',
      'TIER_141',
      'LEGEND',
    ]);
  });

  it('maps all requested boundary checkpoints to expected tiers', () => {
    const checkpoints: Array<[number, string]> = [
      [40, 'BASE'],
      [41, 'TIER_41'],
      [50, 'TIER_41'],
      [51, 'TIER_51'],
      [60, 'TIER_51'],
      [61, 'TIER_61'],
      [70, 'TIER_61'],
      [71, 'TIER_71'],
      [80, 'TIER_71'],
      [81, 'TIER_81'],
      [90, 'TIER_81'],
      [91, 'TIER_91'],
      [100, 'TIER_91'],
      [101, 'TIER_101'],
      [110, 'TIER_101'],
      [111, 'TIER_111'],
      [120, 'TIER_111'],
      [121, 'TIER_121'],
      [130, 'TIER_121'],
      [131, 'TIER_131'],
      [140, 'TIER_131'],
      [141, 'TIER_141'],
      [150, 'TIER_141'],
      [151, 'LEGEND'],
    ];

    for (const [score, expectedBand] of checkpoints) {
      expect(resolveScoreBand('strength', score).id).toBe(expectedBand);
    }
  });

  it('bridges decimal gaps correctly around transitions', () => {
    expect(resolveScoreBand('strength', 40.9).id).toBe('BASE');
    expect(resolveScoreBand('strength', 50.9).id).toBe('TIER_41');
    expect(resolveScoreBand('strength', 150.5).id).toBe('TIER_141');
  });
});

const GRIP_EIGHTEEN_TIER_IDS = [
  'BASE',
  'TIER_41',
  'TIER_51',
  'TIER_61',
  'TIER_71',
  'TIER_81',
  'TIER_91',
  'TIER_101',
  'TIER_111',
  'TIER_121',
  'TIER_131',
  'TIER_141',
  'TIER_151',
  'TIER_161',
  'TIER_171',
  'LEGEND',
  'PANTHEON',
] as const;

describe('resolveScoreBand(gripStrength)', () => {
  it('uses grip-only 18-tier map (not strength 13-tier)', () => {
    const gripIds = SCORE_MEANING_CATALOG.gripStrength.map((band) => band.id);
    const strengthIds = SCORE_MEANING_CATALOG.strength.map((band) => band.id);
    expect(gripIds).toEqual([...GRIP_EIGHTEEN_TIER_IDS]);
    expect(gripIds).not.toEqual(strengthIds);
  });

  it('maps all boundary checkpoints including high grip bands', () => {
    const checkpoints: Array<[number, string]> = [
      [40, 'BASE'],
      [41, 'TIER_41'],
      [50, 'TIER_41'],
      [51, 'TIER_51'],
      [60, 'TIER_51'],
      [61, 'TIER_61'],
      [70, 'TIER_61'],
      [71, 'TIER_71'],
      [80, 'TIER_71'],
      [81, 'TIER_81'],
      [90, 'TIER_81'],
      [91, 'TIER_91'],
      [92, 'TIER_91'],
      [100, 'TIER_91'],
      [101, 'TIER_101'],
      [110, 'TIER_101'],
      [111, 'TIER_111'],
      [120, 'TIER_111'],
      [121, 'TIER_121'],
      [130, 'TIER_121'],
      [131, 'TIER_131'],
      [140, 'TIER_131'],
      [141, 'TIER_141'],
      [150, 'TIER_141'],
      [151, 'TIER_151'],
      [160, 'TIER_151'],
      [161, 'TIER_161'],
      [170, 'TIER_161'],
      [171, 'TIER_171'],
      [180, 'TIER_171'],
      [181, 'LEGEND'],
      [190, 'LEGEND'],
      [191, 'PANTHEON'],
      [224, 'PANTHEON'],
    ];

    for (const [score, expectedBand] of checkpoints) {
      expect(resolveScoreBand('gripStrength', score).id).toBe(expectedBand);
    }
  });

  it('bridges decimal gaps correctly around transitions', () => {
    expect(resolveScoreBand('gripStrength', 40.9).id).toBe('BASE');
    expect(resolveScoreBand('gripStrength', 130.9).id).toBe('TIER_121');
    expect(resolveScoreBand('gripStrength', 131.0).id).toBe('TIER_131');
    expect(resolveScoreBand('gripStrength', 150.5).id).toBe('TIER_141');
    expect(resolveScoreBand('gripStrength', 150.9).id).toBe('TIER_141');
    expect(resolveScoreBand('gripStrength', 151.0).id).toBe('TIER_151');
    expect(resolveScoreBand('gripStrength', 180.9).id).toBe('TIER_171');
    expect(resolveScoreBand('gripStrength', 181.0).id).toBe('LEGEND');
    expect(resolveScoreBand('gripStrength', 190.9).id).toBe('LEGEND');
    expect(resolveScoreBand('gripStrength', 191.0).id).toBe('PANTHEON');
  });
});

const FOURTEEN_TIER_IDS = [
  'BASE',
  'TIER_41',
  'TIER_51',
  'TIER_61',
  'TIER_71',
  'TIER_81',
  'TIER_91',
  'TIER_101',
  'TIER_111',
  'TIER_121',
  'TIER_131',
  'TIER_141',
  'LEGEND',
  'PANTHEON',
] as const;

const FOURTEEN_TIER_CHECKPOINTS: Array<[number, string]> = [
  [40, 'BASE'],
  [41, 'TIER_41'],
  [50, 'TIER_41'],
  [51, 'TIER_51'],
  [80, 'TIER_71'],
  [81, 'TIER_81'],
  [150, 'TIER_141'],
  [151, 'LEGEND'],
  [180, 'LEGEND'],
  [181, 'PANTHEON'],
  [224, 'PANTHEON'],
];

describe('resolveOverallGradeBand', () => {
  it('exposes the full 14-tier homologation map', () => {
    expect(OVERALL_SCORE_BANDS.map((band) => band.id)).toEqual([...FOURTEEN_TIER_IDS]);
  });

  it('maps boundary checkpoints to expected tiers', () => {
    for (const [score, expectedBand] of FOURTEEN_TIER_CHECKPOINTS) {
      expect(resolveOverallGradeBand(score)).toBe(expectedBand);
    }
  });

  it('bridges decimal gaps around LEGEND and PANTHEON', () => {
    expect(resolveOverallGradeBand(150.5)).toBe('TIER_141');
    expect(resolveOverallGradeBand(180.9)).toBe('LEGEND');
    expect(resolveOverallGradeBand(181.0)).toBe('PANTHEON');
  });

  it('clamps invalid scores to BASE', () => {
    expect(resolveOverallGradeBand(Number.NaN)).toBe('BASE');
    expect(resolveOverallGradeBand(-10)).toBe('BASE');
  });
});

describe('home.overallGrade i18n coverage', () => {
  const enGrade = (enHome as { home: { overallGrade: Record<string, string> } }).home.overallGrade;
  const zhGrade = (zhHome as { home: { overallGrade: Record<string, string> } }).home.overallGrade;

  it('defines en/zh copy for every overall grade band', () => {
    expect(enGrade.kicker?.trim().length).toBeGreaterThan(0);
    expect(zhGrade.kicker?.trim().length).toBeGreaterThan(0);
    for (const band of OVERALL_SCORE_BANDS) {
      expect(enGrade[band.id]?.trim().length, `${band.id} en`).toBeGreaterThan(0);
      expect(zhGrade[band.id]?.trim().length, `${band.id} zh`).toBeGreaterThan(0);
    }
  });
});

describe('scoreMeaning i18n coverage (core.json)', () => {
  const metricsWithBandCopy = SIX_AXIS_METRICS.filter(
    (metric) => enBands[metric] != null && zhBands[metric] != null,
  );

  it.each(metricsWithBandCopy)('defines en/zh title+summary for every %s band', (metric) => {
    for (const band of SCORE_MEANING_CATALOG[metric]) {
      const enEntry = enBands[metric][band.id];
      const zhEntry = zhBands[metric][band.id];
      expect(enEntry?.title?.trim().length, `${metric}.${band.id}.title en`).toBeGreaterThan(0);
      expect(enEntry?.summary?.trim().length, `${metric}.${band.id}.summary en`).toBeGreaterThan(0);
      expect(zhEntry?.title?.trim().length, `${metric}.${band.id}.title zh`).toBeGreaterThan(0);
      expect(zhEntry?.summary?.trim().length, `${metric}.${band.id}.summary zh`).toBeGreaterThan(0);
    }
  });

  it('keeps bodyFat and muscleMass band key sets identical across locales', () => {
    for (const locale of ['en', 'zh'] as const) {
      const bands = locale === 'en' ? enBands : zhBands;
      expect(Object.keys(bands.bodyFat).sort()).toEqual(Object.keys(bands.muscleMass).sort());
    }
  });

  it('keeps zh-Hant FFMI, muscle, and explosive band copy monolingual (no bilingual slash merge)', () => {
    for (const metric of ['bodyFat', 'muscleMass', 'explosivePower'] as const) {
      for (const band of SCORE_MEANING_CATALOG[metric]) {
        const zh = zhBands[metric][band.id];
        expect(zh.title, `${metric}.${band.id}.title`).not.toMatch(/\s\/\s/);
        expect(zh.summary, `${metric}.${band.id}.summary`).not.toMatch(/\s\/\s\[/);
      }
    }
  });
});

describe('resolveScoreBand(explosivePower)', () => {
  it('exposes the full 14-tier Torque Spec map', () => {
    expect(SCORE_MEANING_CATALOG.explosivePower.map((band) => band.id)).toEqual([...FOURTEEN_TIER_IDS]);
    expect(EXPLOSIVE_SCORE_BANDS).toBe(SCORE_MEANING_CATALOG.explosivePower);
    expect(ARM_SIZE_SCORE_BANDS).toBe(EXPLOSIVE_SCORE_BANDS);
  });

  it('maps boundary checkpoints to expected tiers', () => {
    for (const [score, expectedBand] of FOURTEEN_TIER_CHECKPOINTS) {
      expect(resolveScoreBand('explosivePower', score).id).toBe(expectedBand);
    }
  });

  it('bridges decimal gaps around LEGEND and PANTHEON', () => {
    expect(resolveScoreBand('explosivePower', 150.5).id).toBe('TIER_141');
    expect(resolveScoreBand('explosivePower', 180.9).id).toBe('LEGEND');
    expect(resolveScoreBand('explosivePower', 181.0).id).toBe('PANTHEON');
  });
});

describe('resolveScoreMeaningMilestone', () => {
  it('returns remaining points until next tier for explosive and armSize', () => {
    expect(resolveScoreMeaningMilestone('explosivePower', 91).remainingPoints).toBe(10);
    expect(resolveScoreMeaningMilestone('armSize', 180).remainingPoints).toBe(1);
    expect(resolveScoreMeaningMilestone('armSize', 181).remainingPoints).toBeNull();
  });
});

describe('ARM_SIZE_SCORE_BANDS (Rim Spec)', () => {
  it('aliases shared 14-tier ladder for optional storage metric', () => {
    expect(ARM_SIZE_SCORE_BANDS.map((band) => band.id)).toEqual([...FOURTEEN_TIER_IDS]);
  });
});

describe('scoreMeaning i18n coverage (armSize)', () => {
  it('defines en/zh title+summary for every armSize band', () => {
    for (const band of ARM_SIZE_SCORE_BANDS) {
      const enEntry = enBands.armSize?.[band.id];
      const zhEntry = zhBands.armSize?.[band.id];
      expect(enEntry?.title?.trim().length, `armSize.${band.id}.title en`).toBeGreaterThan(0);
      expect(enEntry?.summary?.trim().length, `armSize.${band.id}.summary en`).toBeGreaterThan(0);
      expect(zhEntry?.title?.trim().length, `armSize.${band.id}.title zh`).toBeGreaterThan(0);
      expect(zhEntry?.summary?.trim().length, `armSize.${band.id}.summary zh`).toBeGreaterThan(0);
    }
  });

  it('keeps zh-Hant armSize band copy monolingual (no bilingual slash merge)', () => {
    for (const band of ARM_SIZE_SCORE_BANDS) {
      const zh = zhBands.armSize?.[band.id];
      expect(zh?.title, `armSize.${band.id}.title`).not.toMatch(/\s\/\s/);
      expect(zh?.summary, `armSize.${band.id}.summary`).not.toMatch(/\s\/\s\[/);
    }
  });
});

describe.each(['bodyFat', 'muscleMass'] as const)('resolveScoreBand(%s)', (metric) => {
  it('exposes the full 14-tier map with LEGEND capped at 180', () => {
    expect(SCORE_MEANING_CATALOG[metric].map((band) => band.id)).toEqual([...FOURTEEN_TIER_IDS]);
    const legend = SCORE_MEANING_CATALOG[metric].find((band) => band.id === 'LEGEND');
    const pantheon = SCORE_MEANING_CATALOG[metric].find((band) => band.id === 'PANTHEON');
    expect(legend?.max).toBe(180);
    expect(pantheon?.min).toBe(181);
    expect(pantheon?.max).toBe(Number.POSITIVE_INFINITY);
  });

  it('maps boundary checkpoints to expected tiers', () => {
    for (const [score, expectedBand] of FOURTEEN_TIER_CHECKPOINTS) {
      expect(resolveScoreBand(metric, score).id).toBe(expectedBand);
    }
  });

  it('bridges decimal gaps around LEGEND and PANTHEON', () => {
    expect(resolveScoreBand(metric, 150.5).id).toBe('TIER_141');
    expect(resolveScoreBand(metric, 180.9).id).toBe('LEGEND');
    expect(resolveScoreBand(metric, 181.0).id).toBe('PANTHEON');
  });
});
