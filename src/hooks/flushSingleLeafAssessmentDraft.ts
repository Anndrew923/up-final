/**
 * Draft-only flush before opening a single-leaf report from an assessment page.
 *
 * WHY: Page `calculate()` often keeps results in React state until radar persist.
 * The modal re-reads local drafts — without a flush, "測完即曬" would open an empty card.
 * These helpers never write ScoreMap / Firestore; they only update `up.*Inputs` drafts.
 */
import type { ExplosiveAssessmentTab } from './useExplosiveAssessmentPage';
import type { CardioTab } from './useCardioAssessmentPage';
import type { StrengthLiftKey } from '../types/strengthInputs';
import type { ExplosivePowerRawPersisted } from '../types/powerInputs';
import type { PhysicalProfile } from '../types/userProfile';
import {
  loadCardioInputs,
  loadPowerInputs,
  loadStrengthInputs,
  saveArmSizeInputs,
  saveCardioInputs,
  saveGripInputs,
  saveMuscleInputs,
  savePowerInputs,
  saveStrengthInputs,
} from '../services/localStorageService';
import {
  clampRun5KmSplitToFloor,
  getCooperMaxDistanceMetersForGender,
  parse5KmFieldSplit,
  parseCooperDistanceMeters,
} from '../logic/core/cardioScoring';
import { applyExplosiveInputCapsForProfile } from '../logic/core/explosiveInputCaps';
import { applyGripPeakCap } from '../logic/core/gripStrength';
import { parseSmmKg } from '../logic/core/muscleScoring';

export function flushStrengthLiftDraft(args: {
  lift: StrengthLiftKey;
  weightKg: number;
  reps: number;
  bodyWeightKg?: number;
}): void {
  flushAllStrengthLiftDrafts({
    lifts: [{ lift: args.lift, weightKg: args.weightKg, reps: args.reps }],
    bodyWeightKg: args.bodyWeightKg,
  });
}

/**
 * Persist every scored strength lift in one draft write before opening the highest-leaf report.
 * WHY: Bottom / breakthrough CTAs must flush the full page set so switch-strip siblings stay available.
 */
export function flushAllStrengthLiftDrafts(args: {
  lifts: ReadonlyArray<{ lift: StrengthLiftKey; weightKg: number; reps: number }>;
  bodyWeightKg?: number;
}): void {
  if (args.lifts.length === 0) return;
  const prev = loadStrengthInputs();
  const lifts = { ...(prev?.lifts ?? {}) };
  let wrote = 0;
  for (const item of args.lifts) {
    if (
      !Number.isFinite(item.weightKg) ||
      item.weightKg <= 0 ||
      !Number.isFinite(item.reps) ||
      item.reps < 1
    ) {
      continue;
    }
    lifts[item.lift] = { weightKg: item.weightKg, reps: item.reps };
    wrote += 1;
  }
  // WHY: Avoid no-op localStorage writes when every candidate failed validation.
  if (wrote === 0) return;
  saveStrengthInputs({
    lifts,
    ...(args.bodyWeightKg != null && Number.isFinite(args.bodyWeightKg) && args.bodyWeightKg > 0
      ? { bodyWeightKgSnapshot: args.bodyWeightKg }
      : prev?.bodyWeightKgSnapshot != null
        ? { bodyWeightKgSnapshot: prev.bodyWeightKgSnapshot }
        : {}),
  });
}

export function flushGripDraft(args: {
  peakKg: number;
  gender: 'male' | 'female';
}): void {
  const capped = applyGripPeakCap(args.peakKg, args.gender);
  saveGripInputs({ peakKg: capped.usedKg, genderSnapshot: args.gender });
}

export function flushCardioDraft(args: {
  tab: CardioTab;
  distanceInput: string;
  runMinutesInput: string;
  runSecondsInput: string;
  gender: string | null | undefined;
}): boolean {
  const prev = loadCardioInputs() ?? {};
  if (args.tab === 'cooper') {
    const d = parseCooperDistanceMeters(args.distanceInput);
    if (d === null) return false;
    const maxM = getCooperMaxDistanceMetersForGender(args.gender);
    saveCardioInputs({
      ...prev,
      cardio: { distance: Math.min(d, maxM) },
    });
    return true;
  }
  const split = parse5KmFieldSplit(args.runMinutesInput, args.runSecondsInput);
  if (!split) return false;
  const clamped = clampRun5KmSplitToFloor(split, args.gender);
  saveCardioInputs({
    ...prev,
    run_5km: {
      minutes: clamped.minutes,
      seconds: clamped.seconds,
      totalSeconds: clamped.totalSeconds,
      paceInSeconds: Math.round(clamped.totalSeconds / 5),
    },
  });
  return true;
}

export function flushMuscleDraft(smmInput: string): boolean {
  const smmNum = parseSmmKg(smmInput);
  if (smmNum === null) return false;
  saveMuscleInputs({
    muscle: { smmKg: Math.round(smmNum * 100) / 100 },
  });
  return true;
}

export function flushExplosiveDraft(args: {
  tab: ExplosiveAssessmentTab;
  verticalJumpCm: number | null;
  standingLongJumpCm: number | null;
  sprintSeconds: number | null;
  /** Required for age/sex sprint floor — same pipeline as tryComputeExplosiveAssessmentScore. */
  profile: PhysicalProfile | null;
}): void {
  // WHY: Never persist uncapped elite typos when profile is missing — same gate as tryCompute.
  if (!args.profile) return;

  const prev = loadPowerInputs()?.explosivePower ?? {};
  const next: ExplosivePowerRawPersisted = { ...prev };

  // WHY: Draft must store the same capped seconds/cm as formal submit so Selfie re-read matches preview.
  const uncapped = {
    verticalJumpCm: args.tab === 'jumps' ? args.verticalJumpCm : null,
    standingLongJumpCm: args.tab === 'jumps' ? args.standingLongJumpCm : null,
    sprintSeconds: args.tab === 'sprint' ? args.sprintSeconds : null,
  };
  const capped = applyExplosiveInputCapsForProfile(args.profile, uncapped);

  if (args.tab === 'jumps') {
    if (capped.verticalJumpCm != null) next.verticalJumpCm = capped.verticalJumpCm;
    if (capped.standingLongJumpCm != null) next.standingLongJumpCm = capped.standingLongJumpCm;
  } else if (capped.sprintSeconds != null) {
    next.sprintSeconds = capped.sprintSeconds;
  }
  savePowerInputs({ explosivePower: next });
}

export function flushArmSizeDraft(args: {
  armCircumferenceCm: number;
  bodyFatPct: number;
}): void {
  saveArmSizeInputs({
    armCircumferenceCm: args.armCircumferenceCm,
    bodyFatPct: args.bodyFatPct,
  });
}
