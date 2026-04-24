import { useMemo, useState } from 'react';
import {
  calculateOneRm,
  type OneRmMethod,
} from '../logic/core/trainingTools';

export interface OneRmCalculatorState {
  weightInput: string;
  repsInput: string;
  method: OneRmMethod;
  setWeightInput(value: string): void;
  setRepsInput(value: string): void;
  setMethod(value: OneRmMethod): void;
  estimatedOneRmKg: number;
}

function parsePositiveInput(raw: string): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function useOneRmCalculatorPage(): OneRmCalculatorState {
  const [weightInput, setWeightInput] = useState('');
  const [repsInput, setRepsInput] = useState('');
  const [method, setMethod] = useState<OneRmMethod>('average');

  const estimatedOneRmKg = useMemo(() => {
    const weightKg = parsePositiveInput(weightInput);
    const reps = parsePositiveInput(repsInput);
    return calculateOneRm(weightKg, reps, method);
  }, [method, repsInput, weightInput]);

  return {
    weightInput,
    repsInput,
    method,
    setWeightInput,
    setRepsInput,
    setMethod,
    estimatedOneRmKg,
  };
}
