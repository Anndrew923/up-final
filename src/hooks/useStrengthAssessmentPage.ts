import { useCallback, useEffect, useMemo, useState } from 'react';
import { isPhysicalProfileComplete } from '../logic/core/physicalProfile';
import {
  strengthFormFromPersisted,
  tryComputeSingleLiftStrength,
  tryComputeStrengthAssessmentScore,
  type StrengthAssessmentBreakdown,
  type StrengthAssessmentComputeError,
  type StrengthFormStrings,
  type StrengthSingleLiftError,
} from '../logic/core/strengthAssessment';
import {
  loadPhysicalProfile,
  loadStrengthInputs,
  saveStrengthInputs,
  subscribePhysicalProfile,
  subscribeStrengthInputs,
} from '../services/localStorageService';
import type { PhysicalProfile } from '../types/userProfile';
import type { StrengthLiftKey } from '../types/strengthInputs';
import { useScoreStore } from '../stores/scoreStore';

export type PerLiftScore = { oneRepMax: number; finalScore: number };

export interface UseStrengthAssessmentPageResult {
  profile: PhysicalProfile | null;
  profileReady: boolean;
  form: StrengthFormStrings;
  setWeight: (lift: StrengthLiftKey, value: string) => void;
  setReps: (lift: StrengthLiftKey, value: string) => void;
  perLiftResult: Partial<Record<StrengthLiftKey, PerLiftScore>>;
  perLiftError: Partial<Record<StrengthLiftKey, StrengthSingleLiftError>>;
  calculateLift: (lift: StrengthLiftKey) => void;
  combinedScore: number | null;
  combinedBreakdown: StrengthAssessmentBreakdown | null;
  combinedError: StrengthAssessmentComputeError | null;
  calculateCombined: () => void;
  submitDone: boolean;
  submitToRadar: () => void;
}

function readInitialForm(): StrengthFormStrings {
  return strengthFormFromPersisted(loadStrengthInputs());
}

export function useStrengthAssessmentPage(): UseStrengthAssessmentPageResult {
  const setStoreScore = useScoreStore((s) => s.setScore);
  const [profile, setProfile] = useState(loadPhysicalProfile);
  const [form, setForm] = useState<StrengthFormStrings>(() => readInitialForm());

  const [perLiftResult, setPerLiftResult] = useState<Partial<Record<StrengthLiftKey, PerLiftScore>>>({});
  const [perLiftError, setPerLiftError] = useState<
    Partial<Record<StrengthLiftKey, StrengthSingleLiftError>>
  >({});

  const [combinedScore, setCombinedScore] = useState<number | null>(null);
  const [combinedBreakdown, setCombinedBreakdown] = useState<StrengthAssessmentBreakdown | null>(null);
  const [combinedError, setCombinedError] = useState<StrengthAssessmentComputeError | null>(null);
  const [submitDone, setSubmitDone] = useState(false);

  const clearLiftComputed = useCallback((lift: StrengthLiftKey) => {
    setPerLiftResult((r) => {
      if (!r[lift]) return r;
      const next = { ...r };
      delete next[lift];
      return next;
    });
    setPerLiftError((e) => {
      if (!e[lift]) return e;
      const next = { ...e };
      delete next[lift];
      return next;
    });
  }, []);

  const clearCombined = useCallback(() => {
    setCombinedScore(null);
    setCombinedBreakdown(null);
    setCombinedError(null);
    setSubmitDone(false);
  }, []);

  const setWeight = useCallback(
    (lift: StrengthLiftKey, value: string) => {
      setForm((f) => ({ ...f, [lift]: { ...f[lift], weight: value } }));
      clearLiftComputed(lift);
      clearCombined();
    },
    [clearLiftComputed, clearCombined]
  );

  const setReps = useCallback(
    (lift: StrengthLiftKey, value: string) => {
      setForm((f) => ({ ...f, [lift]: { ...f[lift], reps: value } }));
      clearLiftComputed(lift);
      clearCombined();
    },
    [clearLiftComputed, clearCombined]
  );

  const profileReady = isPhysicalProfileComplete(profile);

  useEffect(() => {
    queueMicrotask(() => {
      setPerLiftResult({});
      setPerLiftError({});
      clearCombined();
    });
  }, [profile, clearCombined]);

  useEffect(() => {
    const sync = () => setProfile(loadPhysicalProfile());
    return subscribePhysicalProfile(sync);
  }, []);

  useEffect(() => {
    const sync = () => {
      setForm(strengthFormFromPersisted(loadStrengthInputs()));
      queueMicrotask(() => {
        setPerLiftResult({});
        setPerLiftError({});
        clearCombined();
      });
    };
    return subscribeStrengthInputs(sync);
  }, [clearCombined]);

  const computeArgs = useMemo(
    () => ({
      form,
      profile,
      profileReady,
    }),
    [form, profile, profileReady]
  );

  const calculateLift = useCallback(
    (lift: StrengthLiftKey) => {
      clearCombined();
      setPerLiftError((e) => {
        const next = { ...e };
        delete next[lift];
        return next;
      });
      const res = tryComputeSingleLiftStrength({ lift, form, profile, profileReady });
      if (!res.ok) {
        setPerLiftResult((r) => {
          const next = { ...r };
          delete next[lift];
          return next;
        });
        setPerLiftError((e) => ({ ...e, [lift]: res.error }));
        return;
      }
      setPerLiftResult((r) => ({
        ...r,
        [lift]: { oneRepMax: res.oneRepMax, finalScore: res.finalScore },
      }));
    },
    [form, profile, profileReady, clearCombined]
  );

  const applyCombinedComputeResult = useCallback(
    (result: ReturnType<typeof tryComputeStrengthAssessmentScore>, options: { persist: boolean }) => {
      if (!result.ok) {
        setCombinedError(result.error);
        setCombinedScore(null);
        setCombinedBreakdown(null);
        return false;
      }
      setCombinedError(null);
      setCombinedScore(result.score);
      setCombinedBreakdown(result.breakdown);
      if (options.persist) {
        saveStrengthInputs(result.persisted);
        setStoreScore('strength', result.score);
        setSubmitDone(true);
      }
      return true;
    },
    [setStoreScore]
  );

  const calculateCombined = useCallback(() => {
    setSubmitDone(false);
    applyCombinedComputeResult(tryComputeStrengthAssessmentScore(computeArgs), { persist: false });
  }, [computeArgs, applyCombinedComputeResult]);

  const submitToRadar = useCallback(() => {
    setSubmitDone(false);
    const result = tryComputeStrengthAssessmentScore(computeArgs);
    applyCombinedComputeResult(result, { persist: true });
  }, [computeArgs, applyCombinedComputeResult]);

  return {
    profile,
    profileReady,
    form,
    setWeight,
    setReps,
    perLiftResult,
    perLiftError,
    calculateLift,
    combinedScore,
    combinedBreakdown,
    combinedError,
    calculateCombined,
    submitDone,
    submitToRadar,
  };
}
