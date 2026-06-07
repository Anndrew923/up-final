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
    zhInputMustMatch: /續航/,
    zhOutputMustMatch: /續航/,
    enInputMustMatch: /Cardio/i,
    enOutputMustMatch: /Stint/i,
  },
  muscleMass: {
    zhInputMustMatch: /外觀/,
    zhInputMustNotMatch: /車體/,
    zhOutputMustMatch: /車體外觀/,
    enInputMustMatch: /Appearance/i,
    enOutputMustMatch: /Exterior/i,
  },
  bodyFat: {
    zhInputMustMatch: /排量/,
    zhInputMustNotMatch: /引擎/,
    zhOutputMustMatch: /引擎排量/,
    enInputMustMatch: /Disp/i,
    enOutputMustMatch: /Displacement/i,
  },
  gripStrength: {
    zhInputMustMatch: /抓地/,
    zhOutputMustMatch: /抓地/,
    enInputMustMatch: /Grip/i,
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

export { SIX_AXIS_METRICS };
