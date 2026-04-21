import { useEffect, useMemo, useState } from 'react';
import { mergeScoreMapWithResolvedCardio } from '../logic/core/cardioScoring';
import { mergeScoreMapWithResolvedMuscle } from '../logic/core/muscleScoring';
import { mergeScoreMapWithResolvedExplosivePower } from '../logic/core/powerScoring';
import { mergeScoreMapWithResolvedStrength } from '../logic/core/strengthAssessment';
import { mergeScoreMapWithResolvedGripStrength } from '../logic/core/gripStrength';
import {
  CARDIO_INPUTS_STORAGE_KEY,
  GRIP_INPUTS_STORAGE_KEY,
  MUSCLE_INPUTS_STORAGE_KEY,
  POWER_INPUTS_STORAGE_KEY,
  PHYSICAL_PROFILE_STORAGE_KEY,
  STRENGTH_INPUTS_STORAGE_KEY,
  loadCardioInputs,
  loadGripInputs,
  loadMuscleInputs,
  loadPhysicalProfile,
  loadPowerInputs,
  loadStrengthInputs,
  subscribeCardioInputs,
  subscribeMuscleInputs,
  subscribePhysicalProfile,
  subscribePowerInputs,
  subscribeGripInputs,
  subscribeStrengthInputs,
} from '../services/localStorageService';
import type { ScoreMap } from '../types/scoring';
import { useScoreStore } from '../stores/scoreStore';

/**
 * Zustand scores + local Cooper/5 km + SMM + explosive raw inputs + physical profile → same merged map as Home radar.
 * Subscribes to profile/cardio/muscle/power saves and cross-tab `storage` for those keys.
 */
export function useMergedScoresFromLocalStores(): ScoreMap {
  const scores = useScoreStore((s) => s.scores);
  const [localEpoch, setLocalEpoch] = useState(0);

  useEffect(() => {
    const bump = () => setLocalEpoch((n) => n + 1);
    const unsubP = subscribePhysicalProfile(bump);
    const unsubC = subscribeCardioInputs(bump);
    const unsubM = subscribeMuscleInputs(bump);
    const unsubPw = subscribePowerInputs(bump);
    const unsubSt = subscribeStrengthInputs(bump);
    const unsubGrip = subscribeGripInputs(bump);

    const onStorage = (e: StorageEvent) => {
      const k = e.key;
      if (
        k !== null &&
        k !== CARDIO_INPUTS_STORAGE_KEY &&
        k !== MUSCLE_INPUTS_STORAGE_KEY &&
        k !== POWER_INPUTS_STORAGE_KEY &&
        k !== STRENGTH_INPUTS_STORAGE_KEY &&
        k !== GRIP_INPUTS_STORAGE_KEY &&
        k !== PHYSICAL_PROFILE_STORAGE_KEY
      ) {
        return;
      }
      bump();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      unsubP();
      unsubC();
      unsubM();
      unsubPw();
      unsubSt();
      unsubGrip();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return useMemo(() => {
    void localEpoch;
    const profile = loadPhysicalProfile();
    const withCardio = mergeScoreMapWithResolvedCardio(scores, profile, loadCardioInputs());
    const withMuscle = mergeScoreMapWithResolvedMuscle(withCardio, profile, loadMuscleInputs());
    const withExplosive = mergeScoreMapWithResolvedExplosivePower(withMuscle, profile, loadPowerInputs());
    const withStrength = mergeScoreMapWithResolvedStrength(withExplosive, profile, loadStrengthInputs());
    return mergeScoreMapWithResolvedGripStrength(withStrength, profile, loadGripInputs());
  }, [scores, localEpoch]);
}
