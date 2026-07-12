import { useMemo, useState } from 'react';
import { buildSomatotypeLabSnapshot, type SomatotypeLabSnapshot } from '../logic/core/somatotypeLab';
import { loadArmSizeInputs, loadPhysicalProfile } from '../services/localStorageService';

export interface SomatotypeLabFormState {
  heightInput: string;
  weightInput: string;
  bodyFatInput: string;
  wristInput: string;
  armGirthInput: string;
  isVeteran: boolean;
  setHeightInput(value: string): void;
  setWeightInput(value: string): void;
  setBodyFatInput(value: string): void;
  setWristInput(value: string): void;
  setArmGirthInput(value: string): void;
  setIsVeteran(value: boolean): void;
  snapshot: SomatotypeLabSnapshot | null;
}

function parsePositive(raw: string): number {
  const n = Number(String(raw).trim().replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function parseNonNegative(raw: string): number {
  const n = Number(String(raw).trim().replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : Number.NaN;
}

function readLabPrefill(): {
  heightInput: string;
  weightInput: string;
  bodyFatInput: string;
  armGirthInput: string;
} {
  const profile = loadPhysicalProfile();
  const armDraft = loadArmSizeInputs();
  return {
    heightInput: profile?.heightCm != null ? String(profile.heightCm) : '',
    weightInput: profile?.weightKg != null ? String(profile.weightKg) : '',
    bodyFatInput: armDraft?.bodyFatPct != null ? String(armDraft.bodyFatPct) : '',
    armGirthInput: armDraft?.armCircumferenceCm != null ? String(armDraft.armCircumferenceCm) : '',
  };
}

/**
 * Prefills height/weight from physical profile and arm/BF from arm-size draft once.
 * Wrist stays lab-local (not on core profile schema yet).
 * WHY: Do not live-subscribe arm drafts — that would clobber in-progress edits.
 */
export function useSomatotypeLab(): SomatotypeLabFormState {
  // Lazy once: React invokes the function initializer on mount only.
  const [seed] = useState(readLabPrefill);
  const [heightInput, setHeightInput] = useState(seed.heightInput);
  const [weightInput, setWeightInput] = useState(seed.weightInput);
  const [bodyFatInput, setBodyFatInput] = useState(seed.bodyFatInput);
  const [wristInput, setWristInput] = useState('');
  const [armGirthInput, setArmGirthInput] = useState(seed.armGirthInput);
  const [isVeteran, setIsVeteran] = useState(false);

  const snapshot = useMemo(() => {
    const heightCm = parsePositive(heightInput);
    const weightKg = parsePositive(weightInput);
    const bodyFatPct = parseNonNegative(bodyFatInput);
    const wristCm = parsePositive(wristInput);
    const flexedArmGirthCm = parsePositive(armGirthInput);
    if (
      heightCm <= 0 ||
      weightKg <= 0 ||
      wristCm <= 0 ||
      flexedArmGirthCm <= 0 ||
      !Number.isFinite(bodyFatPct)
    ) {
      return null;
    }
    return buildSomatotypeLabSnapshot({
      heightCm,
      weightKg,
      bodyFatPct,
      wristCm,
      flexedArmGirthCm,
      isVeteran,
    });
  }, [armGirthInput, bodyFatInput, heightInput, isVeteran, weightInput, wristInput]);

  return {
    heightInput,
    weightInput,
    bodyFatInput,
    wristInput,
    armGirthInput,
    isVeteran,
    setHeightInput,
    setWeightInput,
    setBodyFatInput,
    setWristInput,
    setArmGirthInput,
    setIsVeteran,
    snapshot,
  };
}
