import { beforeAll, describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import { enCommon, zhHantCommon } from '../locales/common';
import {
  SIX_AXIS_LEXICON_MAPPING_RULES,
  SIX_AXIS_METRICS,
  SIX_AXIS_OUTPUT_FULL_MIRROR_KEYS,
} from '../sixAxisLexiconRules';
import { resolveSixAxisDataGridLabelParts } from '../resolveSixAxisDataGridLabel';
import { resolveSixAxisChartLabel } from '../resolveSixAxisChartLabel';
import { resolveSixAxisInputShortLabel } from '../resolveSixAxisInputShortLabel';
import type { SixAxisMetric } from '../../types/scoring';

type LocaleBundle = typeof zhHantCommon;

function readNestedString(bundle: LocaleBundle, dottedKey: string, metric: SixAxisMetric): string {
  const parts = dottedKey.split('.');
  let cursor: unknown = bundle;
  for (const part of parts) {
    cursor = (cursor as Record<string, unknown>)[part];
  }
  return (cursor as Record<SixAxisMetric, string>)[metric];
}

function readLexicon(
  bundle: LocaleBundle,
  track: 'input' | 'output',
  variant: 'short' | 'full' | 'chart',
  metric: SixAxisMetric
): string {
  if (track === 'input') {
    const axisLexicon = bundle.axisLexicon as {
      input: { short: Record<SixAxisMetric, string> };
    };
    return axisLexicon.input.short[metric];
  }
  const axisLexicon = bundle.axisLexicon as {
    output: { full: Record<SixAxisMetric, string>; chart: Record<SixAxisMetric, string> };
  };
  return variant === 'chart' ? axisLexicon.output.chart[metric] : axisLexicon.output.full[metric];
}

function readOutputCode(bundle: LocaleBundle, metric: SixAxisMetric): string {
  return (bundle.axisLexicon as { output: { code: Record<SixAxisMetric, string> } }).output.code[
    metric
  ];
}

describe('six-axis lexicon dual-track mapping', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  it.each(SIX_AXIS_METRICS)('zh-Hant %s honors fitness-input vs mechanical-output rules', (metric) => {
    const rule = SIX_AXIS_LEXICON_MAPPING_RULES[metric];
    const inputLabel = readLexicon(zhHantCommon, 'input', 'short', metric);
    const outputLabel = readLexicon(zhHantCommon, 'output', 'full', metric);

    expect(inputLabel).toMatch(rule.zhInputMustMatch);
    if (rule.zhInputMustNotMatch) {
      expect(inputLabel).not.toMatch(rule.zhInputMustNotMatch);
    }
    expect(outputLabel).toMatch(rule.zhOutputMustMatch);
    if (rule.zhOutputMustNotMatch) {
      expect(outputLabel).not.toMatch(rule.zhOutputMustNotMatch);
    }
  });

  it.each(SIX_AXIS_METRICS)('en %s honors fitness-input vs mechanical-output rules', (metric) => {
    const rule = SIX_AXIS_LEXICON_MAPPING_RULES[metric];
    const inputLabel = readLexicon(enCommon, 'input', 'short', metric);
    const outputLabel = readLexicon(enCommon, 'output', 'full', metric);

    expect(inputLabel).toMatch(rule.enInputMustMatch);
    expect(outputLabel).toMatch(rule.enOutputMustMatch);
  });

  it.each(SIX_AXIS_METRICS)(
    'zh-Hant output.full mirrors radar, assessment, and ladder metrics for %s',
    (metric) => {
      const canonical = readLexicon(zhHantCommon, 'output', 'full', metric);
      for (const mirrorKey of SIX_AXIS_OUTPUT_FULL_MIRROR_KEYS) {
        expect(readNestedString(zhHantCommon, mirrorKey, metric)).toBe(canonical);
      }
    }
  );

  it.each(SIX_AXIS_METRICS)(
    'en output.full mirrors radar, assessment, and ladder metrics for %s',
    (metric) => {
      const canonical = readLexicon(enCommon, 'output', 'full', metric);
      for (const mirrorKey of SIX_AXIS_OUTPUT_FULL_MIRROR_KEYS) {
        expect(readNestedString(enCommon, mirrorKey, metric)).toBe(canonical);
      }
    }
  );

  it('zh-Hant output.chart uses sports-physiology labels without polluting output.full', () => {
    expect(readLexicon(zhHantCommon, 'output', 'chart', 'bodyFat')).toBe('FFMI');
    expect(readLexicon(zhHantCommon, 'output', 'chart', 'muscleMass')).toBe('骨骼肌量');
    expect(readLexicon(zhHantCommon, 'output', 'chart', 'strength')).toBe('最大肌力');
    expect(readLexicon(zhHantCommon, 'output', 'chart', 'cardio')).toBe('心肺耐力');
    expect(readLexicon(zhHantCommon, 'output', 'full', 'bodyFat')).toBe('引擎排量');
    expect(readLexicon(zhHantCommon, 'output', 'full', 'muscleMass')).toBe('車體外觀');
    expect(readLexicon(zhHantCommon, 'output', 'chart', 'bodyFat')).not.toBe(
      readLexicon(zhHantCommon, 'output', 'full', 'bodyFat')
    );
    expect(readLexicon(zhHantCommon, 'output', 'chart', 'muscleMass')).not.toBe(
      readLexicon(zhHantCommon, 'output', 'full', 'muscleMass')
    );
  });

  it('en output.chart uses sports-physiology labels (not mechanical codes)', () => {
    for (const metric of SIX_AXIS_METRICS) {
      const chart = readLexicon(enCommon, 'output', 'chart', metric);
      const code = (enCommon.axisLexicon as { output: { code: Record<SixAxisMetric, string> } })
        .output.code[metric];
      expect(chart).not.toBe(code);
      expect(chart.length).toBeGreaterThan(0);
    }
    expect(readLexicon(enCommon, 'output', 'chart', 'strength')).toBe('Max Strength');
    expect(readLexicon(enCommon, 'output', 'chart', 'muscleMass')).toBe('Skeletal Muscle');
    expect(readLexicon(enCommon, 'output', 'chart', 'bodyFat')).toBe('FFMI');
  });

  it.each(SIX_AXIS_METRICS)(
    'home.radar.axisChart mirrors axisLexicon.output.chart for %s',
    (metric) => {
      expect(readNestedString(zhHantCommon, 'home.radar.axisChart', metric)).toBe(
        readLexicon(zhHantCommon, 'output', 'chart', metric)
      );
      expect(readNestedString(enCommon, 'home.radar.axisChart', metric)).toBe(
        readLexicon(enCommon, 'output', 'chart', metric)
      );
    }
  );

  it('i18n.t resolves home.radar.axisChart at runtime (no raw key leak)', () => {
    expect(i18n.t('home.radar.axisChart.strength', { ns: 'common' })).toBe('最大肌力');
    expect(i18n.t('home.radar.axisChart.bodyFat', { ns: 'common' })).toBe('FFMI');
    expect(i18n.t('home.radar.axisChart.strength', { ns: 'common' })).not.toContain('axisChart');
  });

  it('Codex explosivePower system copy uses torque semantics, not horsepower', () => {
    const systems = (zhHantCommon.tools as { codex: { systems: Record<string, string> } }).codex
      .systems;
    expect(systems.explosivePower).toMatch(/扭矩/);
    expect(systems.explosivePower).not.toMatch(/馬力/);
  });

  it('ladder shard tabs keep sports-physiology scan labels (not mechanical output track)', () => {
    const divisions = (zhHantCommon.ladder as { divisions: Record<string, { label: string }> })
      .divisions;
    expect(divisions.stats_sbdTotal.label).toBe('最大肌力');
    expect(divisions.stats_cooper.label).toBe('心肺耐力');
    expect(divisions.stats_vertical.label).toBe('爆發力');
    expect(divisions.stats_grip.label).toBe('握力');
    expect(divisions.stats_bodyFat.label).toBe('FFMI');
    expect(divisions.stats_ffmi.label).toBe('骨骼肌量');
  });

  it.each(SIX_AXIS_METRICS)(
    'console grid parts + chart/input resolvers stay lexicon-aligned for %s',
    (metric) => {
      const tZh = i18n.getFixedT('zh-Hant', 'common');
      const tEn = i18n.getFixedT('en', 'common');

      for (const [bundle, t] of [
        [zhHantCommon, tZh],
        [enCommon, tEn],
      ] as const) {
        const parts = resolveSixAxisDataGridLabelParts(t, metric);
        const axisLexicon = bundle.axisLexicon as {
          input: { short: Record<SixAxisMetric, string>; grid: Record<SixAxisMetric, string> };
          output: {
            mechShort: Record<SixAxisMetric, string>;
            telemetryGrid: Record<SixAxisMetric, string>;
          };
        };
        expect(resolveSixAxisChartLabel(t, metric)).toBe(
          readNestedString(bundle, 'home.radar.axisChart', metric)
        );
        expect(resolveSixAxisChartLabel(t, metric)).toBe(
          readLexicon(bundle, 'output', 'chart', metric)
        );
        expect(resolveSixAxisInputShortLabel(t, metric)).toBe(axisLexicon.input.short[metric]);
        expect(parts.gridPrimary).toBe(axisLexicon.input.grid[metric]);
        expect(parts.mechShort).toBe(axisLexicon.output.mechShort[metric]);
        expect(parts.code).toBe(readOutputCode(bundle, metric));
        expect(parts.gridPrimary).not.toBe(parts.mechShort);

        // WHY: Telemetry console primary must end with canonical // CODE (no legacy BOOST/AERO).
        const telemetryPrimary = axisLexicon.output.telemetryGrid[metric];
        const code = readOutputCode(bundle, metric);
        expect(telemetryPrimary).toMatch(new RegExp(`//\\s*${code}$`));
        expect(telemetryPrimary).not.toMatch(/\b(BOOST|AERO|TORQUE|RIMS)\b/);
      }
    }
  );
});
