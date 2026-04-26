/**
 * Single merge pipeline for Home radar + ladder preview snapshots.
 * WHY: Keeps `useMergedScoresFromLocalStores` and `getMergedScoresSnapshotForRadar` aligned (no drift).
 */
import type { CardioInputsPersisted } from '../../types/cardioInputs';
import type { GripInputsPersisted } from '../../types/gripInputs';
import type { MuscleInputsPersisted } from '../../types/muscleInputs';
import type { PowerInputsPersisted } from '../../types/powerInputs';
import type { ScoreMap } from '../../types/scoring';
import type { StrengthInputsPersisted } from '../../types/strengthInputs';
import type { PhysicalProfile } from '../../types/userProfile';
import { mergeScoreMapWithResolvedCardio } from './cardioScoring';
import { mergeScoreMapWithResolvedGripStrength } from './gripStrength';
import { mergeScoreMapWithResolvedMuscle } from './muscleScoring';
import { mergeScoreMapWithResolvedExplosivePower } from './powerScoring';
import { mergeScoreMapWithResolvedStrength } from './strengthAssessment';

export interface RadarMergedScoresInput {
  scores: ScoreMap;
  profile: PhysicalProfile | null | undefined;
  cardioInputs: CardioInputsPersisted | null | undefined;
  muscleInputs: MuscleInputsPersisted | null | undefined;
  powerInputs: PowerInputsPersisted | null | undefined;
  strengthInputs: StrengthInputsPersisted | null | undefined;
  gripInputs: GripInputsPersisted | null | undefined;
}

/** Zustand scores + persisted local inputs → same map as Home six-axis radar. */
export function mergeScoreMapForHomeRadar(input: RadarMergedScoresInput): ScoreMap {
  const { scores, profile, cardioInputs, muscleInputs, powerInputs, strengthInputs, gripInputs } = input;
  const withCardio = mergeScoreMapWithResolvedCardio(scores, profile, cardioInputs);
  const withMuscle = mergeScoreMapWithResolvedMuscle(withCardio, profile, muscleInputs);
  const withExplosive = mergeScoreMapWithResolvedExplosivePower(withMuscle, profile, powerInputs);
  const withStrength = mergeScoreMapWithResolvedStrength(withExplosive, profile, strengthInputs);
  return mergeScoreMapWithResolvedGripStrength(withStrength, profile, gripInputs);
}
