import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_PHYSIQUE_TIER,
  buildSomatotypeLabSnapshot,
  type PhysiqueTier,
  type SomatotypeLabSnapshot,
} from '../logic/core/somatotypeLab';
import { loadArmSizeInputs, loadPhysicalProfile } from '../services/localStorageService';

export interface SomatotypeLabFormState {
  heightInput: string;
  weightInput: string;
  bodyFatInput: string;
  wristInput: string;
  armGirthInput: string;
  isVeteran: boolean;
  physiqueTier: PhysiqueTier;
  /** True when legendary arm mode locks the veteran calibration control. */
  veteranCalibrationLocked: boolean;
  setHeightInput(value: string): void;
  setWeightInput(value: string): void;
  setBodyFatInput(value: string): void;
  setWristInput(value: string): void;
  setArmGirthInput(value: string): void;
  setIsVeteran(value: boolean): void;
  setPhysiqueTier(value: PhysiqueTier): void;
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
  const [physiqueTier, setPhysiqueTier] = useState<PhysiqueTier>(DEFAULT_PHYSIQUE_TIER);

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
      physiqueTier,
    });
  }, [armGirthInput, bodyFatInput, heightInput, isVeteran, physiqueTier, weightInput, wristInput]);

  const veteranCalibrationLocked = Boolean(snapshot?.maxTuned.legendaryArmMode);

  // WHY: Clear stale checkmarks so UI matches forced-off science path under legendary mode.
  useEffect(() => {
    if (veteranCalibrationLocked && isVeteran) {
      setIsVeteran(false);
    }
  }, [isVeteran, veteranCalibrationLocked]);

  return {
    heightInput,
    weightInput,
    bodyFatInput,
    wristInput,
    armGirthInput,
    isVeteran: veteranCalibrationLocked ? false : isVeteran,
    physiqueTier,
    veteranCalibrationLocked,
    setHeightInput,
    setWeightInput,
    setBodyFatInput,
    setWristInput,
    setArmGirthInput,
    setIsVeteran,
    setPhysiqueTier,
    snapshot,
  };
}
