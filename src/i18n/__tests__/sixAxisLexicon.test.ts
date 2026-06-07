import { beforeAll, describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import { enCommon, zhHantCommon } from '../locales/common';
import {
  ASSESSMENT_LOBBY_SIX_AXIS_CARD_KEYS,
  SIX_AXIS_LEXICON_MAPPING_RULES,
  SIX_AXIS_METRICS,
  SIX_AXIS_OUTPUT_FULL_MIRROR_KEYS,
} from '../sixAxisLexiconRules';
import { splitAssessmentLobbyTitle } from '../../lib/splitAssessmentLobbyTitle';
import { resolveSixAxisDataGridLabelParts } from '../resolveSixAxisDataGridLabel';
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

function readAssessmentLobbyTitle(bundle: LocaleBundle, cardKey: string): string {
  const assessment = bundle.assessment as Record<string, { title: string }>;
  return assessment[cardKey].title;
}

function extractLobbySubtitleCode(subtitle: string | undefined): string {
  expect(subtitle, 'lobby card subtitle must use "// CODE" suffix').toBeTruthy();
  const match = subtitle!.match(/\/\/\s*([A-Z0-9]+)\s*$/);
  expect(match, `subtitle must end with // CODE, got: ${subtitle}`).not.toBeNull();
  return match![1];
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
    'zh-Hant output.full mirrors history, radar, assessment, and ladder metrics for %s',
    (metric) => {
      const canonical = readLexicon(zhHantCommon, 'output', 'full', metric);
      for (const mirrorKey of SIX_AXIS_OUTPUT_FULL_MIRROR_KEYS) {
        expect(readNestedString(zhHantCommon, mirrorKey, metric)).toBe(canonical);
      }
    }
  );

  it.each(SIX_AXIS_METRICS)(
    'en output.full mirrors history, radar, assessment, and ladder metrics for %s',
    (metric) => {
      const canonical = readLexicon(enCommon, 'output', 'full', metric);
      for (const mirrorKey of SIX_AXIS_OUTPUT_FULL_MIRROR_KEYS) {
        expect(readNestedString(enCommon, mirrorKey, metric)).toBe(canonical);
      }
    }
  );

  it('zh-Hant output.chart keeps compact radar vertex labels without polluting output.full', () => {
    expect(readLexicon(zhHantCommon, 'output', 'chart', 'bodyFat')).toBe('排量');
    expect(readLexicon(zhHantCommon, 'output', 'chart', 'muscleMass')).toBe('外觀');
    expect(readLexicon(zhHantCommon, 'output', 'full', 'bodyFat')).toBe('引擎排量');
    expect(readLexicon(zhHantCommon, 'output', 'full', 'muscleMass')).toBe('車體外觀');
    expect(readLexicon(zhHantCommon, 'output', 'chart', 'bodyFat')).not.toBe(
      readLexicon(zhHantCommon, 'output', 'full', 'bodyFat')
    );
    expect(readLexicon(zhHantCommon, 'output', 'chart', 'muscleMass')).not.toBe(
      readLexicon(zhHantCommon, 'output', 'full', 'muscleMass')
    );
  });

  it('en output.chart mirrors output.code for scan-friendly radar vertices', () => {
    for (const metric of SIX_AXIS_METRICS) {
      expect(readLexicon(enCommon, 'output', 'chart', metric)).toBe(
        (enCommon.axisLexicon as { output: { code: Record<SixAxisMetric, string> } }).output.code[
          metric
        ]
      );
    }
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
    expect(i18n.t('home.radar.axisChart.strength', { ns: 'common' })).toBe('馬力');
    expect(i18n.t('home.radar.axisChart.bodyFat', { ns: 'common' })).toBe('排量');
    expect(i18n.t('home.radar.axisChart.strength', { ns: 'common' })).not.toContain('axisChart');
  });

  it('Codex explosivePower system copy uses torque semantics, not horsepower', () => {
    const systems = (zhHantCommon.tools as { codex: { systems: Record<string, string> } }).codex
      .systems;
    expect(systems.explosivePower).toMatch(/扭矩/);
    expect(systems.explosivePower).not.toMatch(/馬力/);
  });

  it('ladder shard tabs keep gym-science scan labels (not mechanical output track)', () => {
    const divisions = (zhHantCommon.ladder as { divisions: Record<string, { label: string }> })
      .divisions;
    expect(divisions.stats_sbdTotal.label).toMatch(/力量/);
    expect(divisions.stats_cooper.label).toMatch(/心肺/);
    expect(divisions.stats_vertical.label).toMatch(/爆發/);
    expect(divisions.stats_grip.label).toMatch(/握力/);
    expect(divisions.stats_bodyFat.label).toMatch(/FFMI/);
  });

  it.each(Object.entries(ASSESSMENT_LOBBY_SIX_AXIS_CARD_KEYS))(
    'zh-Hant assessment lobby %s subtitle code mirrors axisLexicon.output.code',
    (cardKey, metric) => {
      const title = readAssessmentLobbyTitle(zhHantCommon, cardKey);
      const { sub } = splitAssessmentLobbyTitle(title);
      expect(extractLobbySubtitleCode(sub)).toBe(readOutputCode(zhHantCommon, metric));
    }
  );

  it.each(Object.entries(ASSESSMENT_LOBBY_SIX_AXIS_CARD_KEYS))(
    'en assessment lobby %s subtitle code mirrors axisLexicon.output.code',
    (cardKey, metric) => {
      const title = readAssessmentLobbyTitle(enCommon, cardKey);
      const { sub } = splitAssessmentLobbyTitle(title);
      expect(extractLobbySubtitleCode(sub)).toBe(readOutputCode(enCommon, metric));
    }
  );

  it('assessment lobby codes reject legacy non-standard tokens (BOOST, AERO, TORQUE, RIMS)', () => {
    for (const cardKey of Object.keys(ASSESSMENT_LOBBY_SIX_AXIS_CARD_KEYS)) {
      const zhTitle = readAssessmentLobbyTitle(zhHantCommon, cardKey);
      const enTitle = readAssessmentLobbyTitle(enCommon, cardKey);
      for (const title of [zhTitle, enTitle]) {
        const { sub } = splitAssessmentLobbyTitle(title);
        expect(sub ?? '').not.toMatch(/\b(BOOST|AERO|TORQUE|RIMS)\b/);
      }
    }
  });

  it.each(SIX_AXIS_METRICS)(
    'home data grid label parts mirror axisLexicon chart, input.short, and code for %s',
    (metric) => {
      const tZh = i18n.getFixedT('zh-Hant', 'common');
      const tEn = i18n.getFixedT('en', 'common');

      for (const [bundle, t] of [
        [zhHantCommon, tZh],
        [enCommon, tEn],
      ] as const) {
        const parts = resolveSixAxisDataGridLabelParts(t, metric);
        expect(parts.chart).toBe(readNestedString(bundle, 'home.radar.axisChart', metric));
        expect(parts.chart).toBe(readLexicon(bundle, 'output', 'chart', metric));
        expect(parts.inputShort).toBe(readLexicon(bundle, 'input', 'short', metric));
        expect(parts.code).toBe(readOutputCode(bundle, metric));
      }
    }
  );
});
