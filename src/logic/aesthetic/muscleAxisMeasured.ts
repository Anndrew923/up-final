/**
 * Muscle axis-summary dual raw (SMM kg + SM%) — locked at plaque open.
 * WHY: Lives in logic so hooks/stores share one type without UI-store coupling.
 */
import {
  formatWeight,
  type UnitSystem,
} from '../core/unitConverters';

export type MuscleAxisMeasuredMetrics = {
  smmKg: number;
  smPercent: number;
};

export function isValidMuscleAxisMeasured(
  measured: MuscleAxisMeasuredMetrics | undefined | null
): measured is MuscleAxisMeasuredMetrics {
  if (!measured) return false;
  return (
    Number.isFinite(measured.smmKg) &&
    measured.smmKg > 0 &&
    Number.isFinite(measured.smPercent) &&
    measured.smPercent > 0
  );
}

/**
 * WHY: Left column shows device raw instead of "N 項綜合"; unit labels come from i18n at the edge.
 */
export function formatMuscleAxisMeasuredReading(
  measured: MuscleAxisMeasuredMetrics,
  unitSystem: UnitSystem,
  unitLabels: { kg: string; lb: string }
): string {
  const unitLabel = unitSystem === 'metric' ? unitLabels.kg : unitLabels.lb;
  const mass = formatWeight(measured.smmKg, unitSystem, {
    digits: 1,
    unitLabel,
  });
  const pct = Number(measured.smPercent.toFixed(1)).toString();
  return `${mass} · ${pct}%`;
}
