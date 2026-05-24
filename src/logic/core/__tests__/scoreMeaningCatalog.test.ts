import { describe, expect, it } from 'vitest';
import enCore from '../../../i18n/locales/en/common/core.json';
import zhCore from '../../../i18n/locales/zh-Hant/common/core.json';
import { SIX_AXIS_METRICS } from '../../../types/scoring';
import enHome from '../../../i18n/locales/en/common/home.json';
import zhHome from '../../../i18n/locales/zh-Hant/common/home.json';
import {
  ARM_SIZE_SCORE_BANDS,
  DECADE_AXIS_TIER_BANDS,
  DECADE_GRIP_TIER_BANDS,
  EXPLOSIVE_SCORE_BANDS,
  OVERALL_GRADE_BAND_IDS,
  OVERALL_GRADE_TIERS,
  OVERALL_SCORE_BANDS,
  formatOverallGradeRevealLine,
  getOverallGradeKeys,
  resolveOverallGradeBand,
  resolveScoreBand,
  resolveScoreMeaningBand,
  resolveScoreMeaningMilestone,
  SCORE_MEANING_CATALOG,
} from '../scoreMeaningCatalog';

type BandCopy = { title: string; summary: string };
type ScoreMeaningBands = Record<string, Record<string, BandCopy>>;

const enBands = (enCore as { scoreMeaning: { bands: ScoreMeaningBands } }).scoreMeaning.bands;
const zhBands = (zhCore as { scoreMeaning: { bands: ScoreMeaningBands } }).scoreMeaning.bands;

describe('resolveScoreBand(cardio)', () => {
  it('maps decade boundary at 40 correctly', () => {
    expect(resolveScoreBand('cardio', 39.9).id).toBe('BASE');
    expect(resolveScoreBand('cardio', 40.0).id).toBe('TIER_40');
    expect(resolveScoreBand('cardio', 49.99).id).toBe('TIER_40');
  });

  it('maps high scores to LEGEND and PANTHEON', () => {
    expect(resolveScoreBand('cardio', 150.0).id).toBe('LEGEND');
    expect(resolveScoreBand('cardio', 179.99).id).toBe('LEGEND');
    expect(resolveScoreBand('cardio', 180.0).id).toBe('PANTHEON');
  });

  it('maps 5km-mid benchmark score 80 to TIER_80', () => {
    expect(resolveScoreBand('cardio', 79.9).id).toBe('TIER_70');
    expect(resolveScoreBand('cardio', 80.0).id).toBe('TIER_80');
  });

  it('maps zero to BASE', () => {
    expect(resolveScoreBand('cardio', 0).id).toBe('BASE');
  });

  it('bridges decimal gaps correctly around transitions', () => {
    expect(resolveScoreBand('cardio', 149.99).id).toBe('TIER_140');
    expect(resolveScoreBand('cardio', 150.5).id).toBe('LEGEND');
  });
});

describe('resolveScoreBand(strength)', () => {
  it('uses the shared 14-tier decade axis map with PANTHEON', () => {
    const ids = SCORE_MEANING_CATALOG.strength.map((band) => band.id);
    expect(ids).toEqual([...DECADE_AXIS_TIER_IDS]);
  });

  it('maps decade boundary checkpoints to expected tiers', () => {
    for (const [score, expectedBand] of DECADE_AXIS_CHECKPOINTS) {
      expect(resolveScoreBand('strength', score).id).toBe(expectedBand);
    }
  });

  it('bridges decimal gaps correctly around transitions', () => {
    expect(resolveScoreBand('strength', 39.99).id).toBe('BASE');
    expect(resolveScoreBand('strength', 49.99).id).toBe('TIER_40');
    expect(resolveScoreBand('strength', 150.5).id).toBe('LEGEND');
    expect(resolveScoreBand('strength', 179.99).id).toBe('LEGEND');
    expect(resolveScoreBand('strength', 180).id).toBe('PANTHEON');
  });
});

const DECADE_GRIP_TIER_IDS = [
  'BASE',
  'TIER_40',
  'TIER_50',
  'TIER_60',
  'TIER_70',
  'TIER_80',
  'TIER_90',
  'TIER_100',
  'TIER_110',
  'TIER_120',
  'TIER_130',
  'TIER_140',
  'TIER_150',
  'TIER_160',
  'TIER_170',
  'PANTHEON',
] as const;

const DECADE_GRIP_CHECKPOINTS: Array<[number, string]> = [
  [39.99, 'BASE'],
  [40, 'TIER_40'],
  [130, 'TIER_130'],
  [149.99, 'TIER_140'],
  [150, 'TIER_150'],
  [169.99, 'TIER_160'],
  [170, 'TIER_170'],
  [179.99, 'TIER_170'],
  [180, 'PANTHEON'],
  [224, 'PANTHEON'],
];

describe('resolveScoreBand(gripStrength)', () => {
  it('uses grip-only extended decade map (not strength 14-tier)', () => {
    const gripIds = SCORE_MEANING_CATALOG.gripStrength.map((band) => band.id);
    const strengthIds = SCORE_MEANING_CATALOG.strength.map((band) => band.id);
    expect(gripIds).toEqual([...DECADE_GRIP_TIER_IDS]);
    expect(gripIds).not.toEqual(strengthIds);
    expect(DECADE_GRIP_TIER_BANDS).toBe(SCORE_MEANING_CATALOG.gripStrength);
  });

  it('maps boundary checkpoints including high grip bands', () => {
    for (const [score, expectedBand] of DECADE_GRIP_CHECKPOINTS) {
      expect(resolveScoreBand('gripStrength', score).id).toBe(expectedBand);
    }
  });

  it('bridges decimal gaps correctly around transitions', () => {
    expect(resolveScoreBand('gripStrength', 39.99).id).toBe('BASE');
    expect(resolveScoreBand('gripStrength', 130.59).id).toBe('TIER_130');
    expect(resolveScoreBand('gripStrength', 149.99).id).toBe('TIER_140');
    expect(resolveScoreBand('gripStrength', 150).id).toBe('TIER_150');
    expect(resolveScoreBand('gripStrength', 179.99).id).toBe('TIER_170');
    expect(resolveScoreBand('gripStrength', 180).id).toBe('PANTHEON');
  });
});

const DECADE_AXIS_TIER_IDS = [
  'BASE',
  'TIER_40',
  'TIER_50',
  'TIER_60',
  'TIER_70',
  'TIER_80',
  'TIER_90',
  'TIER_100',
  'TIER_110',
  'TIER_120',
  'TIER_130',
  'TIER_140',
  'LEGEND',
  'PANTHEON',
] as const;

const DECADE_AXIS_CHECKPOINTS: Array<[number, string]> = [
  [39.99, 'BASE'],
  [40, 'TIER_40'],
  [49.99, 'TIER_40'],
  [50, 'TIER_50'],
  [80, 'TIER_80'],
  [90, 'TIER_90'],
  [130, 'TIER_130'],
  [150, 'LEGEND'],
  [179.99, 'LEGEND'],
  [180, 'PANTHEON'],
  [224, 'PANTHEON'],
];

const OVERALL_GRADE_TIER_IDS = [
  'BASE',
  'TIER_40',
  'TIER_50',
  'TIER_60',
  'TIER_70',
  'TIER_80',
  'TIER_90',
  'TIER_100',
  'TIER_110',
  'TIER_120',
  'TIER_130',
  'TIER_140',
  'LEGEND',
  'PANTHEON',
] as const;

const OVERALL_GRADE_CHECKPOINTS: Array<[number, string]> = [
  [39.99, 'BASE'],
  [40, 'TIER_40'],
  [49.99, 'TIER_40'],
  [50, 'TIER_50'],
  [70, 'TIER_70'],
  [80, 'TIER_80'],
  [90, 'TIER_90'],
  [100, 'TIER_100'],
  [129.99, 'TIER_120'],
  [130, 'TIER_130'],
  [130.59, 'TIER_130'],
  [139.99, 'TIER_130'],
  [140, 'TIER_140'],
  [149.99, 'TIER_140'],
  [150, 'LEGEND'],
  [179.99, 'LEGEND'],
  [180, 'PANTHEON'],
  [224, 'PANTHEON'],
];

describe('overall grade i18n helpers', () => {
  it('getOverallGradeKeys returns stable paths per band', () => {
    expect(getOverallGradeKeys('TIER_50')).toEqual({
      name: 'home.overallGrade.TIER_50.name',
      desc: 'home.overallGrade.TIER_50.desc',
      representativeCar: 'home.overallGrade.TIER_50.representativeCar',
      carPrice: 'home.overallGrade.TIER_50.carPrice',
      carSpecLabel: 'home.overallGrade.carSpecLabel',
      priceLabel: 'home.overallGrade.priceLabel',
      kicker: 'home.overallGrade.kicker',
      hint: 'home.overallGrade.viewDetailHint',
    });
  });

  it('formatOverallGradeRevealLine joins name and desc for ritual typewriter', () => {
    expect(formatOverallGradeRevealLine('STAGE 1 TUNE', 'Power platform now taking shape.')).toBe(
      'STAGE 1 TUNE\nPower platform now taking shape.'
    );
  });
});

describe('resolveOverallGradeBand', () => {
  it('exposes the full decade-gated homologation map', () => {
    expect(OVERALL_GRADE_TIERS.map((band) => band.id)).toEqual([...OVERALL_GRADE_BAND_IDS]);
    expect(OVERALL_SCORE_BANDS).toBe(OVERALL_GRADE_TIERS);
    expect([...OVERALL_GRADE_BAND_IDS]).toEqual([...OVERALL_GRADE_TIER_IDS]);
    expect([...OVERALL_GRADE_BAND_IDS]).toEqual([...DECADE_AXIS_TIER_IDS]);
    expect(DECADE_AXIS_TIER_BANDS.map((band) => band.id)).toEqual([...DECADE_AXIS_TIER_IDS]);
  });

  it('maps decade boundary checkpoints to expected tiers', () => {
    for (const [score, expectedBand] of OVERALL_GRADE_CHECKPOINTS) {
      expect(resolveOverallGradeBand(score)).toBe(expectedBand);
    }
  });

  it('bridges decimal gaps around LEGEND and PANTHEON', () => {
    expect(resolveOverallGradeBand(149.99)).toBe('TIER_140');
    expect(resolveOverallGradeBand(150.5)).toBe('LEGEND');
    expect(resolveOverallGradeBand(179.99)).toBe('LEGEND');
    expect(resolveOverallGradeBand(180)).toBe('PANTHEON');
  });

  it('clamps invalid scores to BASE', () => {
    expect(resolveOverallGradeBand(Number.NaN)).toBe('BASE');
    expect(resolveOverallGradeBand(-10)).toBe('BASE');
  });
});

describe('home.diagnostics and resonance i18n', () => {
  const enHomeBlock = (enHome as { home: Record<string, unknown> }).home;
  const zhHomeBlock = (zhHome as { home: Record<string, unknown> }).home;
  const enDiag = enHomeBlock.diagnostics as Record<string, string>;
  const zhDiag = zhHomeBlock.diagnostics as Record<string, string>;
  const enRes = enHomeBlock.resonance as Record<string, string>;
  const zhRes = zhHomeBlock.resonance as Record<string, string>;

  it('defines panelTitle and report copy in en/zh', () => {
    expect(enDiag.panelTitle?.trim().length).toBeGreaterThan(0);
    expect(zhDiag.panelTitle?.trim().length).toBeGreaterThan(0);
    expect(enRes.reportTitle?.trim().length).toBeGreaterThan(0);
    expect(zhRes.reportTitle?.trim().length).toBeGreaterThan(0);
  });
});

describe('home.overallGrade i18n coverage', () => {
  type OverallGradeTierCopy = {
    name: string;
    desc: string;
    representativeCar: string;
    carPrice: string;
  };
  type OverallGradeLocale = {
    kicker: string;
    viewDetailHint: string;
    [bandId: string]: string | OverallGradeTierCopy;
  };

  const enGrade = (enHome as { home: { overallGrade: OverallGradeLocale } }).home.overallGrade;
  const zhGrade = (zhHome as { home: { overallGrade: OverallGradeLocale } }).home.overallGrade;

  it('defines en/zh kicker, hint, and name+desc for every overall grade band', () => {
    expect(enGrade.kicker?.trim().length).toBeGreaterThan(0);
    expect(zhGrade.kicker?.trim().length).toBeGreaterThan(0);
    expect(enGrade.viewDetailHint?.trim().length).toBeGreaterThan(0);
    expect(zhGrade.viewDetailHint?.trim().length).toBeGreaterThan(0);
    for (const bandId of OVERALL_GRADE_BAND_IDS) {
      const enTier = enGrade[bandId] as OverallGradeTierCopy;
      const zhTier = zhGrade[bandId] as OverallGradeTierCopy;
      expect(enTier?.name?.trim().length, `${bandId} name en`).toBeGreaterThan(0);
      expect(enTier?.desc?.trim().length, `${bandId} desc en`).toBeGreaterThan(0);
      expect(zhTier?.name?.trim().length, `${bandId} name zh`).toBeGreaterThan(0);
      expect(zhTier?.desc?.trim().length, `${bandId} desc zh`).toBeGreaterThan(0);
      expect(enTier?.representativeCar?.trim().length, `${bandId} car en`).toBeGreaterThan(0);
      expect(zhTier?.representativeCar?.trim().length, `${bandId} car zh`).toBeGreaterThan(0);
      expect(enTier?.carPrice?.trim().length, `${bandId} price en`).toBeGreaterThan(0);
      expect(zhTier?.carPrice?.trim().length, `${bandId} price zh`).toBeGreaterThan(0);
    }
  });
});

describe('scoreMeaning i18n coverage (core.json)', () => {
  const metricsWithBandCopy = SIX_AXIS_METRICS.filter(
    (metric) => enBands[metric] != null && zhBands[metric] != null
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
  it('exposes the full 14-tier decade Torque Spec map', () => {
    expect(SCORE_MEANING_CATALOG.explosivePower.map((band) => band.id)).toEqual([
      ...DECADE_AXIS_TIER_IDS,
    ]);
    expect(EXPLOSIVE_SCORE_BANDS).toBe(DECADE_AXIS_TIER_BANDS);
    expect(ARM_SIZE_SCORE_BANDS).toBe(EXPLOSIVE_SCORE_BANDS);
  });

  it('maps boundary checkpoints to expected tiers', () => {
    for (const [score, expectedBand] of DECADE_AXIS_CHECKPOINTS) {
      expect(resolveScoreBand('explosivePower', score).id).toBe(expectedBand);
    }
  });

  it('bridges decimal gaps around LEGEND and PANTHEON', () => {
    expect(resolveScoreBand('explosivePower', 149.99).id).toBe('TIER_140');
    expect(resolveScoreBand('explosivePower', 150.5).id).toBe('LEGEND');
    expect(resolveScoreBand('explosivePower', 179.99).id).toBe('LEGEND');
    expect(resolveScoreBand('explosivePower', 180).id).toBe('PANTHEON');
  });
});

describe('resolveScoreMeaningMilestone', () => {
  it('returns remaining points until next tier for explosive and armSize', () => {
    expect(resolveScoreMeaningMilestone('explosivePower', 90).remainingPoints).toBe(10);
    expect(resolveScoreMeaningMilestone('armSize', 179).remainingPoints).toBe(1);
    expect(resolveScoreMeaningMilestone('armSize', 180).remainingPoints).toBeNull();
  });
});

describe('ARM_SIZE_SCORE_BANDS (Rim Spec)', () => {
  it('aliases shared decade axis ladder for optional storage metric', () => {
    expect(ARM_SIZE_SCORE_BANDS.map((band) => band.id)).toEqual([...DECADE_AXIS_TIER_IDS]);
  });

  it('maps armSize score 130 to TIER_130', () => {
    expect(resolveScoreMeaningBand('armSize', 130).id).toBe('TIER_130');
    expect(resolveScoreMeaningBand('armSize', 39.9).id).toBe('BASE');
    expect(resolveScoreMeaningBand('armSize', 40).id).toBe('TIER_40');
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
  it('exposes the full decade map with PANTHEON at 180+', () => {
    expect(SCORE_MEANING_CATALOG[metric].map((band) => band.id)).toEqual([...DECADE_AXIS_TIER_IDS]);
    const legend = SCORE_MEANING_CATALOG[metric].find((band) => band.id === 'LEGEND');
    const pantheon = SCORE_MEANING_CATALOG[metric].find((band) => band.id === 'PANTHEON');
    expect(legend?.min).toBe(150);
    expect(legend?.max).toBe(179.99);
    expect(pantheon?.min).toBe(180);
  });

  it('maps boundary checkpoints to expected tiers', () => {
    for (const [score, expectedBand] of DECADE_AXIS_CHECKPOINTS) {
      expect(resolveScoreBand(metric, score).id).toBe(expectedBand);
    }
  });

  it('bridges decimal gaps around LEGEND and PANTHEON', () => {
    expect(resolveScoreBand(metric, 149.99).id).toBe('TIER_140');
    expect(resolveScoreBand(metric, 150.5).id).toBe('LEGEND');
    expect(resolveScoreBand(metric, 179.99).id).toBe('LEGEND');
    expect(resolveScoreBand(metric, 180).id).toBe('PANTHEON');
  });
});
