import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BARBELL_WEIGHT_PRESETS_KG,
  BARBELL_WEIGHT_PRESETS_LB,
  PLATE_SET_PRESETS_KG,
  PLATE_SET_PRESETS_LB,
  convertKgToLb,
  convertLbToKg,
  planBarbellPlates,
  type TrainingUnit,
} from '../logic/core/trainingTools';
import {
  reprojectDisplayInput,
  trainingUnitToUnitSystem,
  unitSystemToTrainingUnit,
} from '../logic/core/unitConverters';
import { useUnitPreferenceStore } from '../stores/unitPreferenceStore';
import type { PlateDisplayPick } from '../types/trainingToolsDisplay';

export type { PlateDisplayPick };

/** Product path: commercial gym plate inventory only (no UI preset picker). */
const DEFAULT_PLATE_SET = 'commercial' as const;

export interface PlateCalculatorState {
  /** Derived from global unit preference (`metric`→kg, `imperial`→lb). */
  unit: TrainingUnit;
  targetTotalInput: string;
  barWeightInput: string;
  setTargetTotalInput(value: string): void;
  setBarWeightInput(value: string): void;
  resolvedBarWeightDisplay: number;
  picksDisplay: PlateDisplayPick[];
  perSideDisplay: number;
  leftoverDisplay: number;
  isExactMatch: boolean;
  hasResult: boolean;
  activePlateSetDisplay: readonly number[];
}

function parsePositiveInput(raw: string): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function parseNonNegativeInput(raw: string): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function defaultBarWeightInput(unit: TrainingUnit): string {
  return unit === 'kg'
    ? String(BARBELL_WEIGHT_PRESETS_KG.olympic20)
    : String(BARBELL_WEIGHT_PRESETS_LB.olympic45);
}

/** Round display plate values to inventory-friendly 2dp (avoids 44.99 lb ghosts). */
function roundPlateDisplay(value: number): number {
  return Math.round(value * 100) / 100;
}

export function usePlateCalculatorPage(): PlateCalculatorState {
  const unitSystem = useUnitPreferenceStore((s) => s.unitSystem);
  const unit = unitSystemToTrainingUnit(unitSystem);
  const prevUnitRef = useRef(unit);

  const [targetTotalInput, setTargetTotalInput] = useState('');
  const [barWeightInput, setBarWeightInput] = useState(() =>
    defaultBarWeightInput(unitSystemToTrainingUnit(unitSystem))
  );

  // WHY: Reproject target mass; bar snaps to olympic stock for the new system (20 kg / 45 lb).
  useEffect(() => {
    const prev = prevUnitRef.current;
    if (prev === unit) return;
    prevUnitRef.current = unit;
    const from = trainingUnitToUnitSystem(prev);
    const to = trainingUnitToUnitSystem(unit);
    setTargetTotalInput((raw) => reprojectDisplayInput(raw, 'weight', from, to, 2));
    setBarWeightInput(defaultBarWeightInput(unit));
  }, [unit]);

  const resolvedBarWeightDisplay = useMemo(
    () => parseNonNegativeInput(barWeightInput),
    [barWeightInput]
  );

  const activePlateSetDisplay = useMemo(() => {
    if (unit === 'kg') return PLATE_SET_PRESETS_KG[DEFAULT_PLATE_SET];
    return PLATE_SET_PRESETS_LB[DEFAULT_PLATE_SET];
  }, [unit]);

  const plan = useMemo(() => {
    const targetTotalDisplay = parsePositiveInput(targetTotalInput);
    const barWeightDisplay = resolvedBarWeightDisplay;
    if (targetTotalDisplay <= 0 || barWeightDisplay < 0) return planBarbellPlates(0, 0);

    const targetTotalKg = unit === 'kg' ? targetTotalDisplay : convertLbToKg(targetTotalDisplay);
    const barWeightKg = unit === 'kg' ? barWeightDisplay : convertLbToKg(barWeightDisplay);
    const plateSetKg =
      unit === 'kg'
        ? activePlateSetDisplay
        : activePlateSetDisplay.map((value) => convertLbToKg(value));
    return planBarbellPlates(targetTotalKg, barWeightKg, plateSetKg);
  }, [activePlateSetDisplay, resolvedBarWeightDisplay, targetTotalInput, unit]);

  const picksDisplay = useMemo(
    () =>
      plan.picks.map((pick) => ({
        plateValue:
          unit === 'kg' ? pick.plateKg : roundPlateDisplay(convertKgToLb(pick.plateKg)),
        count: pick.count,
      })),
    [plan.picks, unit]
  );

  const perSideDisplay =
    unit === 'kg' ? plan.perSideKg : roundPlateDisplay(convertKgToLb(plan.perSideKg));
  const leftoverDisplay =
    unit === 'kg' ? plan.leftoverKg : roundPlateDisplay(convertKgToLb(plan.leftoverKg));
  const hasResult = picksDisplay.length > 0;

  return {
    unit,
    targetTotalInput,
    barWeightInput,
    setTargetTotalInput,
    setBarWeightInput,
    resolvedBarWeightDisplay,
    picksDisplay,
    perSideDisplay,
    leftoverDisplay,
    isExactMatch: plan.ok,
    hasResult,
    activePlateSetDisplay,
  };
}
