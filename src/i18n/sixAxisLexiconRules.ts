import { SIX_AXIS_METRICS, type SixAxisMetric } from '../types/scoring';

/** Design intent (WHY): Guardrails for dual-track lexicon — input stays fitness-science, output stays mechanical. */
export interface SixAxisLexiconMappingRule {
  zhInputMustMatch: RegExp;
  zhInputMustNotMatch?: RegExp;
  zhOutputMustMatch: RegExp;
  zhOutputMustNotMatch?: RegExp;
  enInputMustMatch: RegExp;
  enOutputMustMatch: RegExp;
}

export const SIX_AXIS_LEXICON_MAPPING_RULES: Record<SixAxisMetric, SixAxisLexiconMappingRule> = {
  strength: {
    zhInputMustMatch: /力量/,
    zhInputMustNotMatch: /馬力/,
    zhOutputMustMatch: /馬力/,
    enInputMustMatch: /Strength/i,
    enOutputMustMatch: /Horsepower/i,
  },
  explosivePower: {
    zhInputMustMatch: /爆發/,
    zhInputMustNotMatch: /扭矩|馬力/,
    zhOutputMustMatch: /扭矩/,
    zhOutputMustNotMatch: /馬力/,
    enInputMustMatch: /Explosive/i,
    enOutputMustMatch: /Torque/i,
  },
  cardio: {
    zhInputMustMatch: /心肺/,
    zhInputMustNotMatch: /續航/,
    zhOutputMustMatch: /續航/,
    enInputMustMatch: /Cardio/i,
    enOutputMustMatch: /Stint/i,
  },
  muscleMass: {
    zhInputMustMatch: /肌肉總量|肌肉/,
    zhInputMustNotMatch: /外觀|車體|圍度/,
    zhOutputMustMatch: /車體外觀/,
    enInputMustMatch: /Muscle Mass/i,
    enOutputMustMatch: /Exterior/i,
  },
  bodyFat: {
    zhInputMustMatch: /FFMI/,
    zhInputMustNotMatch: /排量|引擎|體脂/,
    zhOutputMustMatch: /引擎排量/,
    enInputMustMatch: /FFMI/i,
    enOutputMustMatch: /Displacement/i,
  },
  gripStrength: {
    zhInputMustMatch: /握力/,
    zhInputMustNotMatch: /抓地/,
    zhOutputMustMatch: /抓地/,
    enInputMustMatch: /Grip Str/i,
    enOutputMustMatch: /Traction/i,
  },
};

/** Output surfaces that must mirror `axisLexicon.output.full` verbatim. */
export const SIX_AXIS_OUTPUT_FULL_MIRROR_KEYS = [
  'history.shortAxis',
  'home.radar.axis',
  'assessment.axis',
  'ladder.metrics',
] as const;

/** Chart vertex labels: runtime reads `home.radar.axisChart`; must stay parity-locked to `axisLexicon.output.chart`. */
export const SIX_AXIS_OUTPUT_CHART_MIRROR_KEY = 'home.radar.axisChart' as const;

/**
 * Lobby cards wired to Core Six axes (WHY): Subtitle `// CODE` suffix must mirror
 * `axisLexicon.output.code` — guarded in `sixAxisLexicon.test.ts`.
 */
export const ASSESSMENT_LOBBY_SIX_AXIS_CARD_KEYS = {
  strength: 'strength',
  explosive: 'explosivePower',
  cardio: 'cardio',
  muscle: 'muscleMass',
  ffmi: 'bodyFat',
  grip: 'gripStrength',
} as const satisfies Record<string, SixAxisMetric>;

export { SIX_AXIS_METRICS };
