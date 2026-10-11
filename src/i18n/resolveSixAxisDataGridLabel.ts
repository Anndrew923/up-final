import type { TFunction } from 'i18next';
import type { SixAxisMetric } from '../types/scoring';

export interface SixAxisDataGridLabelParts {
  /** Console / ladder 2×3 primary fitness display name. */
  gridPrimary: string;
  /** Compact mechanical noun for secondary annotation. */
  mechShort: string;
  code: string;
}

/**
 * Console data-grid label parts (WHY): Fitness-first primary + mechanical `// CODE noun`.
 * Radar vertices resolve via `resolveSixAxisChartLabel` — kept out of this object so grid
 * renders do not pay for unused chart/input.short lookups.
 */
export function resolveSixAxisDataGridLabelParts(
  t: TFunction,
  metric: SixAxisMetric
): SixAxisDataGridLabelParts {
  return {
    gridPrimary: t(`axisLexicon.input.grid.${metric}`, { ns: 'common' }),
    mechShort: t(`axisLexicon.output.mechShort.${metric}`, { ns: 'common' }),
    code: t(`axisLexicon.output.code.${metric}`, { ns: 'common' }),
  };
}

/** Secondary mechanical annotation — e.g. `// HP 馬力`. */
export function formatSixAxisDataGridMechAnnotation(parts: SixAxisDataGridLabelParts): string {
  return `// ${parts.code} ${parts.mechShort}`;
}

/** Collapsed dual-track string for title / tests — primary · // CODE mech. */
export function formatSixAxisDataGridVisibleLabel(parts: SixAxisDataGridLabelParts): string {
  return `${parts.gridPrimary} · ${formatSixAxisDataGridMechAnnotation(parts)}`;
}
