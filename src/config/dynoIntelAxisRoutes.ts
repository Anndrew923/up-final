import { ROUTES, type RoutePath } from './routes';
import { SIX_AXIS_METRICS, type SixAxisMetric } from '../types/scoring';

/**
 * Six-axis metric → assessment route for DYNO INTEL gap guidance.
 * WHY: Single map shared by logic builder — stays aligned with assessment lobby paths.
 */
export const DYNO_INTEL_AXIS_ASSESSMENT_ROUTE: Record<SixAxisMetric, RoutePath> = {
  strength: ROUTES.strength,
  explosivePower: ROUTES.explosive,
  cardio: ROUTES.cardio,
  muscleMass: ROUTES.muscle,
  bodyFat: ROUTES.ffmi,
  gripStrength: ROUTES.grip,
};

export function assessmentRouteForSixAxis(axis: SixAxisMetric): RoutePath {
  return DYNO_INTEL_AXIS_ASSESSMENT_ROUTE[axis];
}

/** Stable iteration order for gap / delta builders. */
export const DYNO_INTEL_SIX_AXIS_ORDER = SIX_AXIS_METRICS;
