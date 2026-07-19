import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_PHYSIQUE_TIER,
  DEFAULT_SOMATOTYPE_GENDER,
  buildSomatotypeLabSnapshot,
  isPhysiqueTier,
  isSomatotypeGender,
  type PhysiqueTier,
  type SomatotypeGender,
  type SomatotypeLabSnapshot,
} from '../logic/core/somatotypeLab';
import {
  loadArmSizeInputs,
  loadFfmiDraft,
  loadPhysicalProfile,
  loadSomatotypeLabInputs,
} from '../services/localStorageService';

export interface SomatotypeLabFormState {
  heightInput: string;
  weightInput: string;
  bodyFatInput: string;
  wristInput: string;
  armGirthInput: string;
  isVeteran: boolean;
  gender: SomatotypeGender;
  physiqueTier: PhysiqueTier;
  /** True when legendary arm mode locks the veteran calibration control. */
  veteranCalibrationLocked: boolean;
  setHeightInput(value: string): void;
  setWeightInput(value: string): void;
  setBodyFatInput(value: string): void;
  setWristInput(value: string): void;
  setArmGirthInput(value: string): void;
  setIsVeteran(value: boolean): void;
  setGender(value: SomatotypeGender): void;
  setPhysiqueTier(value: PhysiqueTier): void;
  snapshot: SomatotypeLabSnapshot | null;
}

export interface SomatotypeLabPrefill {
  heightInput: string;
  weightInput: string;
  bodyFatInput: string;
  wristInput: string;
  armGirthInput: string;
  gender: SomatotypeGender;
  isVeteran: boolean;
  physiqueTier: PhysiqueTier;
}

function parsePositive(raw: string): number {
  const n = Number(String(raw).trim().replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function parseNonNegative(raw: string): number {
  const n = Number(String(raw).trim().replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : Number.NaN;
}

function positiveNumberToInput(value: number | undefined | null): string {
  return value != null && Number.isFinite(value) && value > 0 ? String(value) : '';
}

function nonNegativeNumberToInput(value: number | undefined | null): string {
  return value != null && Number.isFinite(value) && value >= 0 ? String(value) : '';
}

/** Only accept FFMI draft strings that parse as a usable non-negative body-fat value. */
function bodyFatInputFromFfmiDraft(raw: string | undefined): string {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (trimmed === '') return '';
  const n = Number(trimmed.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? trimmed : '';
}

/**
 * Prefill priority:
 * 1) Lab-local draft (`up.somatotypeLabInputs`) — full form including wrist.
 * 2) Empty-field fallback — height/weight/gender from physicalProfile;
 *    body fat from armSizeInputs then ffmiDraft (bridges FFMI ↔ lab island);
 *    arm girth from armSizeInputs.
 * WHY: Do not live-subscribe global drafts — that would clobber in-progress edits.
 */
export function readLabPrefill(): SomatotypeLabPrefill {
  const lab = loadSomatotypeLabInputs();
  const profile = loadPhysicalProfile();
  const armDraft = loadArmSizeInputs();
  const ffmiDraft = loadFfmiDraft();

  const heightFromLab = positiveNumberToInput(lab?.heightCm);
  const weightFromLab = positiveNumberToInput(lab?.weightKg);
  const bodyFatFromLab = nonNegativeNumberToInput(lab?.bodyFatPct);
  const wristFromLab = positiveNumberToInput(lab?.wristCm);
  const armFromLab = positiveNumberToInput(lab?.flexedArmGirthCm);

  const heightFromProfile = positiveNumberToInput(profile?.heightCm);
  const weightFromProfile = positiveNumberToInput(profile?.weightKg);
  const bodyFatFromArm = nonNegativeNumberToInput(armDraft?.bodyFatPct);
  const bodyFatFromFfmi = bodyFatInputFromFfmiDraft(ffmiDraft?.bodyFatPctInput);
  const armFromArmDraft = positiveNumberToInput(armDraft?.armCircumferenceCm);

  const genderFromLab = isSomatotypeGender(lab?.gender) ? lab.gender : null;
  const genderFromProfile = isSomatotypeGender(profile?.gender) ? profile.gender : null;

  return {
    heightInput: heightFromLab || heightFromProfile,
    weightInput: weightFromLab || weightFromProfile,
    bodyFatInput: bodyFatFromLab || bodyFatFromArm || bodyFatFromFfmi,
    wristInput: wristFromLab,
    armGirthInput: armFromLab || armFromArmDraft,
    gender: genderFromLab ?? genderFromProfile ?? DEFAULT_SOMATOTYPE_GENDER,
    isVeteran: Boolean(lab?.isVeteran),
    physiqueTier: isPhysiqueTier(lab?.physiqueTier) ? lab.physiqueTier : DEFAULT_PHYSIQUE_TIER,
  };
}

/**
 * Prefills from lab draft first, then physical/arm/FFMI fallbacks once on mount.
 * WHY: Do not live-subscribe arm drafts — that would clobber in-progress edits.
 */
export function useSomatotypeLab(): SomatotypeLabFormState {
  // Lazy once: React invokes the function initializer on mount only.
  const [seed] = useState(readLabPrefill);
  const [heightInput, setHeightInput] = useState(seed.heightInput);
  const [weightInput, setWeightInput] = useState(seed.weightInput);
  const [bodyFatInput, setBodyFatInput] = useState(seed.bodyFatInput);
  const [wristInput, setWristInput] = useState(seed.wristInput);
  const [armGirthInput, setArmGirthInput] = useState(seed.armGirthInput);
  const [isVeteran, setIsVeteran] = useState(seed.isVeteran);
  const [gender, setGender] = useState<SomatotypeGender>(seed.gender);
  const [physiqueTier, setPhysiqueTier] = useState<PhysiqueTier>(seed.physiqueTier);

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
      gender,
    });
  }, [
    armGirthInput,
    bodyFatInput,
    gender,
    heightInput,
    isVeteran,
    physiqueTier,
    weightInput,
    wristInput,
  ]);

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
    gender,
    physiqueTier,
    veteranCalibrationLocked,
    setHeightInput,
    setWeightInput,
    setBodyFatInput,
    setWristInput,
    setArmGirthInput,
    setIsVeteran,
    setGender,
    setPhysiqueTier,
    snapshot,
  };
}
