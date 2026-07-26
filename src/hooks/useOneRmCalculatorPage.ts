import { useEffect, useMemo, useRef, useState } from 'react';
import { calculateOneRm, type OneRmMethod } from '../logic/core/trainingTools';
import {
  parseInputToMetric,
  reprojectDisplayInput,
  toDisplayWeight,
} from '../logic/core/unitConverters';
import { useUnitPreferenceStore } from '../stores/unitPreferenceStore';

export interface OneRmCalculatorState {
  weightInput: string;
  repsInput: string;
  method: OneRmMethod;
  setWeightInput(value: string): void;
  setRepsInput(value: string): void;
  setMethod(value: OneRmMethod): void;
  /** Always metric — formulas and persistence stay in kg. */
  estimatedOneRmKg: number;
  /** Display-system projection of estimated 1RM for previews. */
  estimatedOneRmDisplay: number;
}

function parsePositiveReps(raw: string): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function useOneRmCalculatorPage(): OneRmCalculatorState {
  const unitSystem = useUnitPreferenceStore((s) => s.unitSystem);
  const prevUnitSystemRef = useRef(unitSystem);
  const [weightInput, setWeightInput] = useState('');
  const [repsInput, setRepsInput] = useState('');
  const [method, setMethod] = useState<OneRmMethod>('average');

  useEffect(() => {
    const prev = prevUnitSystemRef.current;
    if (prev === unitSystem) return;
    prevUnitSystemRef.current = unitSystem;
    setWeightInput((raw) => reprojectDisplayInput(raw, 'weight', prev, unitSystem));
  }, [unitSystem]);

  const estimatedOneRmKg = useMemo(() => {
    const weightKg = parseInputToMetric(weightInput, 'weight', unitSystem);
    const reps = parsePositiveReps(repsInput);
    if (weightKg === null || weightKg <= 0 || reps <= 0) return 0;
    return calculateOneRm(weightKg, reps, method);
  }, [method, repsInput, unitSystem, weightInput]);

  const estimatedOneRmDisplay = useMemo(
    () => toDisplayWeight(estimatedOneRmKg, unitSystem),
    [estimatedOneRmKg, unitSystem]
  );

  return {
    weightInput,
    repsInput,
    method,
    setWeightInput,
    setRepsInput,
    setMethod,
    estimatedOneRmKg,
    estimatedOneRmDisplay,
  };
}
