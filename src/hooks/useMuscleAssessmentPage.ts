import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MuscleAssessmentBreakdown, MuscleAssessmentComputeError } from '../logic/core/muscleScoring';
import {
  getSmmKgCeilingForGender,
  isSmmKgAboveCeiling,
  parseSmmKg,
  tryComputeMuscleAssessmentScore,
} from '../logic/core/muscleScoring';
import { isPhysicalProfileComplete } from '../logic/core/physicalProfile';
import {
  loadMuscleInputs,
  loadPhysicalProfile,
  saveMuscleInputs,
  subscribePhysicalProfile,
} from '../services/localStorageService';
import { queueStructuredProfileAfterRadarSubmit } from '../services/structuredSyncAfterRadarSubmit';
import type { PhysicalProfile } from '../types/userProfile';
import { useScoreStore } from '../stores/scoreStore';

export type MusclePageErrorKey = MuscleAssessmentComputeError | null;

function readInitialSmm(): string {
  const raw = loadMuscleInputs()?.muscle?.smmKg;
  if (raw === undefined || raw === null) return '';
  return String(raw);
}

export interface UseMuscleAssessmentPageResult {
  profileReady: boolean;
  profile: PhysicalProfile | null;
  smmInput: string;
  setSmmInput: (v: string) => void;
  previewScore: number | null;
  previewBreakdown: MuscleAssessmentBreakdown | null;
  submitDone: boolean;
  errorKey: MusclePageErrorKey;
  clearError: () => void;
  calculate: () => void;
  submitToRadar: () => void;
  smmCeilingKg: number | null;
  scoreLocked: boolean;
}

export function useMuscleAssessmentPage(): UseMuscleAssessmentPageResult {
  const setStoreScore = useScoreStore((s) => s.setScore);

  const [profile, setProfile] = useState<PhysicalProfile | null>(loadPhysicalProfile);
  const [smmInput, setSmmInputState] = useState(readInitialSmm);
  const [previewScore, setPreviewScore] = useState<number | null>(null);
  const [previewBreakdown, setPreviewBreakdown] = useState<MuscleAssessmentBreakdown | null>(null);
  const [submitDone, setSubmitDone] = useState(false);
  const [errorKey, setErrorKey] = useState<MusclePageErrorKey>(null);

  const profileReady = isPhysicalProfileComplete(profile);

  const smmCeilingKg = useMemo(
    () => (profile && profileReady ? getSmmKgCeilingForGender(profile.gender) : null),
    [profile, profileReady]
  );

  const scoreLocked = useMemo(() => {
    if (smmCeilingKg === null) return false;
    const n = parseSmmKg(smmInput);
    if (n === null) return false;
    return isSmmKgAboveCeiling(n, profile?.gender);
  }, [smmInput, smmCeilingKg, profile?.gender]);

  useEffect(() => {
    const sync = () => setProfile(loadPhysicalProfile());
    return subscribePhysicalProfile(sync);
  }, []);

  const setSmmInput = useCallback((v: string) => {
    setSmmInputState(v);
    setPreviewScore(null);
    setPreviewBreakdown(null);
    setSubmitDone(false);
  }, []);

  const clearError = useCallback(() => setErrorKey(null), []);

  const calculate = useCallback(() => {
    setSubmitDone(false);
    setErrorKey(null);

    const result = tryComputeMuscleAssessmentScore({
      smmInput,
      profile,
      profileReady,
    });

    if (!result.ok) {
      setErrorKey(result.error);
      setPreviewScore(null);
      setPreviewBreakdown(null);
      return;
    }
    setPreviewScore(result.score);
    setPreviewBreakdown(result.breakdown);
  }, [profile, profileReady, smmInput]);

  const submitToRadar = useCallback(() => {
    setSubmitDone(false);
    setErrorKey(null);

    const result = tryComputeMuscleAssessmentScore({
      smmInput,
      profile,
      profileReady,
    });

    if (!result.ok) {
      setErrorKey(result.error);
      return;
    }

    const smmNum = parseSmmKg(smmInput);
    if (smmNum === null) {
      setErrorKey('invalid-smm');
      return;
    }

    saveMuscleInputs({
      muscle: { smmKg: Math.round(smmNum * 100) / 100 },
    });
    setStoreScore('muscleMass', result.score);
    setSubmitDone(true);
    queueStructuredProfileAfterRadarSubmit();
  }, [profile, profileReady, setStoreScore, smmInput]);

  return {
    profileReady,
    profile,
    smmInput,
    setSmmInput,
    previewScore,
    previewBreakdown,
    submitDone,
    errorKey,
    clearError,
    calculate,
    submitToRadar,
    smmCeilingKg,
    scoreLocked,
  };
}
