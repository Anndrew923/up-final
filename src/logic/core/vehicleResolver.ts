import { SIX_AXIS_METRICS, type RadarPoint } from '../../types/scoring';

export type VehicleClassId =
  | 'G_PLATFORM'
  | 'HIGH_OUTPUT'
  | 'ENDURANCE_PROTO'
  | 'WIDE_BODY'
  | 'AERO_SPEC'
  | 'MR_SPEC'
  | 'GT_CRUISER';

function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function getDominantAxis(radarData: readonly RadarPoint[]): RadarPoint['key'] {
  const scoreByAxis = new Map(radarData.map((point) => [point.key, point.value] as const));
  let dominant = SIX_AXIS_METRICS[0];
  let dominantScore = Number.NEGATIVE_INFINITY;
  for (const axis of SIX_AXIS_METRICS) {
    const score = scoreByAxis.get(axis) ?? 0;
    if (score > dominantScore) {
      dominant = axis;
      dominantScore = score;
    }
  }
  return dominant;
}

export function resolveVehicleClass(radarData: readonly RadarPoint[]): VehicleClassId {
  const values = radarData.map((point) => Math.max(0, Number(point.value) || 0));
  const avg = mean(values);
  const sd = standardDeviation(values);

  if (sd < 10 && avg > 50) return 'GT_CRUISER';

  const dominant = getDominantAxis(radarData);
  if (dominant === 'strength') return 'G_PLATFORM';
  if (dominant === 'explosivePower') return 'HIGH_OUTPUT';
  if (dominant === 'cardio') return 'ENDURANCE_PROTO';
  if (dominant === 'muscleMass') return 'WIDE_BODY';
  if (dominant === 'bodyFat') return 'AERO_SPEC';
  return 'MR_SPEC';
}
