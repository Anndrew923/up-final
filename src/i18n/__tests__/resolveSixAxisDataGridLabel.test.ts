import { beforeAll, describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import {
  formatSixAxisDataGridMechAnnotation,
  formatSixAxisDataGridVisibleLabel,
  resolveSixAxisDataGridLabelParts,
} from '../resolveSixAxisDataGridLabel';
import { SIX_AXIS_METRICS, type SixAxisMetric } from '../../types/scoring';

const ZH_VISIBLE_EXPECTED: Record<SixAxisMetric, string> = {
  strength: '五項力量 · // HP 馬力',
  explosivePower: '爆發力 · // TRQ 扭矩',
  cardio: '心肺耐力 · // STINT 續航',
  muscleMass: '肌肉總量 · // CHSS 外觀',
  bodyFat: 'FFMI · // P2W 排量',
  gripStrength: '握力評測 · // GRIP 抓地',
};

const EN_VISIBLE_EXPECTED: Record<SixAxisMetric, string> = {
  strength: 'Max Strength · // HP Horsepower',
  explosivePower: 'Explosive Power · // TRQ Torque',
  cardio: 'Cardio Endurance · // STINT Stint',
  muscleMass: 'Muscle Mass · // CHSS Build',
  bodyFat: 'FFMI · // P2W Density',
  gripStrength: 'Grip Test · // GRIP Traction',
};

describe('resolveSixAxisDataGridLabelParts (zh-Hant)', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  it.each(SIX_AXIS_METRICS)('zh-Hant %s bridges fitness primary + mechanical annotation', (metric) => {
    const t = i18n.getFixedT('zh-Hant', 'common');
    const parts = resolveSixAxisDataGridLabelParts(t, metric);

    expect(parts.gridPrimary).toBe(t(`axisLexicon.input.grid.${metric}`, { ns: 'common' }));
    expect(parts.mechShort).toBe(t(`axisLexicon.output.mechShort.${metric}`, { ns: 'common' }));
    expect(parts.code).toBe(t(`axisLexicon.output.code.${metric}`, { ns: 'common' }));
    expect(parts.gridPrimary).not.toContain('axisLexicon');
    expect(formatSixAxisDataGridMechAnnotation(parts)).toMatch(/^\/\/ [A-Z0-9]+ /);
  });

  it.each(SIX_AXIS_METRICS)('zh-Hant %s renders fitness-first visible label', (metric) => {
    const t = i18n.getFixedT('zh-Hant', 'common');
    const parts = resolveSixAxisDataGridLabelParts(t, metric);
    const visible = formatSixAxisDataGridVisibleLabel(parts);

    expect(visible).toBe(ZH_VISIBLE_EXPECTED[metric]);
    expect(visible.startsWith(parts.gridPrimary)).toBe(true);
    expect(visible).toContain(formatSixAxisDataGridMechAnnotation(parts));
  });
});

describe('resolveSixAxisDataGridLabelParts (en)', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('en');
  });

  it.each(SIX_AXIS_METRICS)('en %s renders fitness-first visible label', (metric) => {
    const t = i18n.getFixedT('en', 'common');
    const parts = resolveSixAxisDataGridLabelParts(t, metric);
    const visible = formatSixAxisDataGridVisibleLabel(parts);

    expect(visible).toBe(EN_VISIBLE_EXPECTED[metric]);
  });
});
