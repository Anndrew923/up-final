import { beforeAll, describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import {
  formatSixAxisDataGridTitle,
  formatSixAxisDataGridVisibleLabel,
  resolveSixAxisDataGridLabelParts,
} from '../resolveSixAxisDataGridLabel';
import { resolveSixAxisChartLabel } from '../resolveSixAxisChartLabel';
import { SIX_AXIS_METRICS, type SixAxisMetric } from '../../types/scoring';

const ZH_DUAL_TRACK_EXPECTED: Record<SixAxisMetric, string> = {
  strength: '馬力 · 力量',
  explosivePower: '扭矩 · 爆發',
  cardio: '續航 · 心肺',
  muscleMass: '外觀 · 肌肉總量',
  bodyFat: '排量 · FFMI',
  gripStrength: '抓地 · 握力',
};

const EN_DUAL_TRACK_EXPECTED: Record<SixAxisMetric, string> = {
  strength: 'HP · Strength',
  explosivePower: 'TRQ · Explosive',
  cardio: 'STINT · Cardio',
  muscleMass: 'CHSS · Muscle Mass',
  bodyFat: 'P2W · FFMI',
  gripStrength: 'GRIP · Grip Str.',
};

function assertNoDuplicateTrack(visible: string, chart: string, inputShort: string): void {
  expect(chart).not.toBe(inputShort);
  expect(visible).toBe(`${chart} · ${inputShort}`);
  const [left, right] = visible.split(' · ');
  expect(left).toBe(chart);
  expect(right).toBe(inputShort);
  expect(left).not.toBe(right);
}

describe('resolveSixAxisDataGridLabelParts (zh-Hant)', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  it.each(SIX_AXIS_METRICS)('zh-Hant %s bridges chart, fitness short, and code without raw keys', (metric) => {
    const t = i18n.getFixedT('zh-Hant', 'common');
    const parts = resolveSixAxisDataGridLabelParts(t, metric);

    expect(parts.chart).toBe(resolveSixAxisChartLabel(t, metric));
    expect(parts.inputShort).toBe(t(`axisLexicon.input.short.${metric}`, { ns: 'common' }));
    expect(parts.code).toBe(t(`axisLexicon.output.code.${metric}`, { ns: 'common' }));
    expect(parts.chart).not.toContain('axisLexicon');
    expect(parts.inputShort).not.toContain('input.short');
    expect(parts.code.length).toBeGreaterThan(0);
  });

  it.each(SIX_AXIS_METRICS)('zh-Hant %s renders rigid dual-track visible label', (metric) => {
    const t = i18n.getFixedT('zh-Hant', 'common');
    const parts = resolveSixAxisDataGridLabelParts(t, metric);
    const visible = formatSixAxisDataGridVisibleLabel(parts);

    assertNoDuplicateTrack(visible, parts.chart, parts.inputShort);
    expect(visible).toBe(ZH_DUAL_TRACK_EXPECTED[metric]);
  });

  it.each(SIX_AXIS_METRICS)('zh-Hant %s title mirrors visible label plus // code', (metric) => {
    const t = i18n.getFixedT('zh-Hant', 'common');
    const parts = resolveSixAxisDataGridLabelParts(t, metric);
    const visible = formatSixAxisDataGridVisibleLabel(parts);

    expect(formatSixAxisDataGridTitle(parts)).toBe(`${visible} // ${parts.code}`);
    const [left, right] = visible.split(' · ');
    expect(left).not.toBe(right);
  });
});

describe('resolveSixAxisDataGridLabelParts (en)', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('en');
  });

  it.each(SIX_AXIS_METRICS)('en %s renders rigid dual-track visible label', (metric) => {
    const t = i18n.getFixedT('en', 'common');
    const parts = resolveSixAxisDataGridLabelParts(t, metric);
    const visible = formatSixAxisDataGridVisibleLabel(parts);

    assertNoDuplicateTrack(visible, parts.chart, parts.inputShort);
    expect(visible).toBe(EN_DUAL_TRACK_EXPECTED[metric]);
  });

  it.each(SIX_AXIS_METRICS)('en %s title mirrors visible label plus // code', (metric) => {
    const t = i18n.getFixedT('en', 'common');
    const parts = resolveSixAxisDataGridLabelParts(t, metric);
    const visible = formatSixAxisDataGridVisibleLabel(parts);

    expect(formatSixAxisDataGridTitle(parts)).toBe(`${visible} // ${parts.code}`);
  });
});
