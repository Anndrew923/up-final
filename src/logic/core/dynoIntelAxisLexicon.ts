import type { SixAxisMetric } from '../../types/scoring';
import type { DynoIntelContextV1 } from './dynoIntelTypes';

/** Maps telemetry axis keys to user-facing assessment labels (locale-aware). */
const SURFACE_LABELS: Record<'zh-Hant' | 'en', Record<SixAxisMetric, string>> = {
  'zh-Hant': {
    strength: '力量 / 馬力 (strength 軸分數)',
    explosivePower: '爆發 / 扭矩 (explosivePower 軸分數)',
    cardio: '心肺 / 續航 (cardio 軸分數)',
    muscleMass: '肌肉量 / 車體剛性 (muscleMass 軸分數)',
    bodyFat: 'FFMI / 引擎排量 (bodyFat 軸分數)',
    gripStrength: '握力 / 抓地 (gripStrength 軸分數)',
  },
  en: {
    strength: 'Strength / HP (strength axis score)',
    explosivePower: 'Explosive / torque (explosivePower axis score)',
    cardio: 'Cardio / endurance (cardio axis score)',
    muscleMass: 'Muscle mass / chassis (muscleMass axis score)',
    bodyFat: 'FFMI / engine displacement (bodyFat axis score)',
    gripStrength: 'Grip / traction (gripStrength axis score)',
  },
};

export type DynoFocusAxisLexicon = NonNullable<DynoIntelContextV1['focusAxisLexicon']>;

/**
 * WHY: Users say "FFMI" on the FFMI page but JSON uses bodyFat — lexicon bridges UI copy to telemetry.
 */
export function buildFocusAxisLexicon(
  focusAxis: SixAxisMetric | null | undefined,
  locale: 'zh-Hant' | 'en'
): DynoFocusAxisLexicon | null {
  if (!focusAxis) return null;
  return {
    axis: focusAxis,
    telemetryKey: focusAxis,
    surfaceLabel: getAxisSurfaceLabel(focusAxis, locale),
  };
}

export function getAxisSurfaceLabel(axis: SixAxisMetric, locale: 'zh-Hant' | 'en'): string {
  return SURFACE_LABELS[locale][axis];
}
