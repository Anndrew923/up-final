/**
 * Edge loader for single-leaf report drafts (localStorage + merged scores).
 * WHY: Keeps `singleLeafReport` pure while share/modal hooks share one snapshot path.
 */
import {
  resolveSmartDefaultReport,
  type SingleLeafDraftBundle,
  type SmartDefaultSelection,
} from '../logic/aesthetic/singleLeafReport';
import { mergeScoreMapForHomeRadar } from '../logic/core/radarMergedScores';
import {
  loadArmSizeInputs,
  loadCardioInputs,
  loadFfmiDraft,
  loadGripInputs,
  loadMuscleInputs,
  loadPhysicalProfile,
  loadPowerInputs,
  loadStrengthInputs,
} from '../services/localStorageService';
import type { ScoreMap } from '../types/scoring';

export function loadSingleLeafDraftBundle(baseScores: ScoreMap = {}): SingleLeafDraftBundle {
  const profile = loadPhysicalProfile();
  const strength = loadStrengthInputs();
  const power = loadPowerInputs();
  const cardio = loadCardioInputs();
  const muscle = loadMuscleInputs();
  const grip = loadGripInputs();
  const armSize = loadArmSizeInputs();
  const ffmi = loadFfmiDraft();
  const scores = mergeScoreMapForHomeRadar({
    scores: baseScores,
    profile,
    cardioInputs: cardio,
    muscleInputs: muscle,
    powerInputs: power,
    strengthInputs: strength,
    gripInputs: grip,
  });
  return { profile, strength, power, cardio, muscle, grip, armSize, ffmi, scores };
}

export function resolveSmartDefaultFromLocalScores(
  baseScores: ScoreMap
): SmartDefaultSelection | null {
  return resolveSmartDefaultReport(loadSingleLeafDraftBundle(baseScores));
}
