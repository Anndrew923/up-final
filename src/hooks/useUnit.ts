import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatLength as formatLengthCore,
  formatWeight as formatWeightCore,
  parseInputToMetric as parseInputToMetricCore,
  toDisplayLength,
  toDisplayWeight,
  unitSystemToTrainingUnit,
  type FormatUnitOptions,
  type MetricQuantity,
  type UnitSystem,
} from '../logic/core/unitConverters';
import { useUnitPreferenceStore } from '../stores/unitPreferenceStore';

export type UseUnitResult = {
  unitSystem: UnitSystem;
  setUnitSystem: (system: UnitSystem) => void;
  /** Mass unit for training tools (`kg` | `lb`). */
  trainingUnit: 'kg' | 'lb';
  labels: {
    systemMetric: string;
    systemImperial: string;
    weight: string;
    length: string;
  };
  formatWeight: (kgValue: number, options?: FormatUnitOptions) => string;
  formatLength: (cmValue: number, options?: FormatUnitOptions) => string;
  /** Project stored kg into the active display system (numeric only). */
  displayWeight: (kgValue: number) => number;
  /** Project stored cm into the active display system (numeric only). */
  displayLength: (cmValue: number) => number;
  parseInputToMetric: (inputValue: string | number, type: MetricQuantity) => number | null;
};

/**
 * UI facade for the global unit preference.
 * WHY: Components stay presentational — conversion + i18n labels live here, not in pages.
 */
export function useUnit(): UseUnitResult {
  const { t } = useTranslation('common');
  const unitSystem = useUnitPreferenceStore((s) => s.unitSystem);
  const setUnitSystem = useUnitPreferenceStore((s) => s.setUnitSystem);

  const labels = useMemo(
    () => ({
      systemMetric: t('units.system.metric'),
      systemImperial: t('units.system.imperial'),
      weight: unitSystem === 'metric' ? t('units.weight.kg') : t('units.weight.lb'),
      length: unitSystem === 'metric' ? t('units.length.cm') : t('units.length.in'),
    }),
    [t, unitSystem]
  );

  const formatWeight = useCallback(
    (kgValue: number, options: FormatUnitOptions = {}) =>
      formatWeightCore(kgValue, unitSystem, {
        ...options,
        unitLabel: options.unitLabel ?? labels.weight,
      }),
    [labels.weight, unitSystem]
  );

  const formatLength = useCallback(
    (cmValue: number, options: FormatUnitOptions = {}) =>
      formatLengthCore(cmValue, unitSystem, {
        ...options,
        unitLabel: options.unitLabel ?? labels.length,
      }),
    [labels.length, unitSystem]
  );

  const displayWeight = useCallback(
    (kgValue: number) => toDisplayWeight(kgValue, unitSystem),
    [unitSystem]
  );

  const displayLength = useCallback(
    (cmValue: number) => toDisplayLength(cmValue, unitSystem),
    [unitSystem]
  );

  const parseInputToMetric = useCallback(
    (inputValue: string | number, type: MetricQuantity) =>
      parseInputToMetricCore(inputValue, type, unitSystem),
    [unitSystem]
  );

  return {
    unitSystem,
    setUnitSystem,
    trainingUnit: unitSystemToTrainingUnit(unitSystem),
    labels,
    formatWeight,
    formatLength,
    displayWeight,
    displayLength,
    parseInputToMetric,
  };
}
