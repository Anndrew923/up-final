import { useMemo, useState } from 'react';
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

export type BarbellPreset = 'olympic' | 'women' | 'technique' | 'custom';
export type PlateSetPreset = 'commercial' | 'competition' | 'homeBasic';

export interface PlateDisplayPick {
  plateValue: number;
  count: number;
}

export interface PlateCalculatorState {
  unit: TrainingUnit;
  barbellPreset: BarbellPreset;
  plateSetPreset: PlateSetPreset;
  targetTotalInput: string;
  barWeightInput: string;
  setUnit(value: TrainingUnit): void;
  setBarbellPreset(value: BarbellPreset): void;
  setPlateSetPreset(value: PlateSetPreset): void;
  setTargetTotalInput(value: string): void;
  setBarWeightInput(value: string): void;
  usesCustomBarWeight: boolean;
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

export function usePlateCalculatorPage(): PlateCalculatorState {
  const [unit, setUnit] = useState<TrainingUnit>('kg');
  const [barbellPreset, setBarbellPreset] = useState<BarbellPreset>('olympic');
  const [plateSetPreset, setPlateSetPreset] = useState<PlateSetPreset>('commercial');
  const [targetTotalInput, setTargetTotalInput] = useState('');
  const [barWeightInput, setBarWeightInput] = useState('20');

  const usesCustomBarWeight = barbellPreset === 'custom';

  const resolvedBarWeightDisplay = useMemo(() => {
    if (usesCustomBarWeight) return parseNonNegativeInput(barWeightInput);
    if (unit === 'kg') {
      if (barbellPreset === 'women') return BARBELL_WEIGHT_PRESETS_KG.womens15;
      if (barbellPreset === 'technique') return BARBELL_WEIGHT_PRESETS_KG.technique10;
      return BARBELL_WEIGHT_PRESETS_KG.olympic20;
    }
    if (barbellPreset === 'women') return BARBELL_WEIGHT_PRESETS_LB.technique35;
    if (barbellPreset === 'technique') return BARBELL_WEIGHT_PRESETS_LB.technique35;
    return BARBELL_WEIGHT_PRESETS_LB.olympic45;
  }, [barWeightInput, barbellPreset, unit, usesCustomBarWeight]);

  const activePlateSetDisplay = useMemo(() => {
    if (unit === 'kg') return PLATE_SET_PRESETS_KG[plateSetPreset];
    return PLATE_SET_PRESETS_LB[plateSetPreset];
  }, [plateSetPreset, unit]);

  const plan = useMemo(() => {
    const targetTotalDisplay = parsePositiveInput(targetTotalInput);
    const barWeightDisplay = resolvedBarWeightDisplay;
    if (targetTotalDisplay <= 0 || barWeightDisplay < 0) return planBarbellPlates(0, 0);

    const targetTotalKg = unit === 'kg' ? targetTotalDisplay : convertLbToKg(targetTotalDisplay);
    const barWeightKg = unit === 'kg' ? barWeightDisplay : convertLbToKg(barWeightDisplay);
    const plateSetKg =
      unit === 'kg' ? activePlateSetDisplay : activePlateSetDisplay.map((value) => convertLbToKg(value));
    return planBarbellPlates(targetTotalKg, barWeightKg, plateSetKg);
  }, [activePlateSetDisplay, resolvedBarWeightDisplay, targetTotalInput, unit]);

  const picksDisplay = useMemo(
    () =>
      plan.picks.map((pick) => ({
        plateValue: unit === 'kg' ? pick.plateKg : convertKgToLb(pick.plateKg),
        count: pick.count,
      })),
    [plan.picks, unit]
  );

  const perSideDisplay = unit === 'kg' ? plan.perSideKg : convertKgToLb(plan.perSideKg);
  const leftoverDisplay = unit === 'kg' ? plan.leftoverKg : convertKgToLb(plan.leftoverKg);
  const hasResult = picksDisplay.length > 0;

  return {
    unit,
    barbellPreset,
    plateSetPreset,
    targetTotalInput,
    barWeightInput,
    setUnit,
    setBarbellPreset,
    setPlateSetPreset,
    setTargetTotalInput,
    setBarWeightInput,
    usesCustomBarWeight,
    resolvedBarWeightDisplay,
    picksDisplay,
    perSideDisplay,
    leftoverDisplay,
    isExactMatch: plan.ok,
    hasResult,
    activePlateSetDisplay,
  };
}
