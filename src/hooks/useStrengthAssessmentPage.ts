import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { navigateHomeWithResonance } from '../services/radarResonanceNavigation';
import { queueStructuredProfileAfterRadarSubmit } from '../services/structuredSyncAfterRadarSubmit';
import type { PhysicalProfile } from '../types/userProfile';
import { STRENGTH_LIFT_KEYS, type StrengthLiftKey } from '../types/strengthInputs';
import { useScoreStore } from '../stores/scoreStore';

export type PerLiftScore = {
  oneRepMax: number;
  finalScore: number;
  weightCapped: boolean;
  weightInputKg: number;
  weightUsedKg: number;
  modelMaxKg: number;
};

export interface StrengthRadarPoint {
  key: StrengthLiftKey;
  label: string;
  value: number;
}

export interface StrengthSubmitNotice {
  kind: 'success' | 'error';
  savedScore?: number;
  error?: StrengthAssessmentComputeError;
}

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
  strengthRadarPoints: StrengthRadarPoint[];
  calculateCombined: () => void;
  submitBusy: boolean;
  submitNotice: StrengthSubmitNotice | null;
  submitDone: boolean;
  submitToRadar: () => Promise<void>;
}

function readInitialForm(): StrengthFormStrings {
  return strengthFormFromPersisted(loadStrengthInputs());
}

export function useStrengthAssessmentPage(): UseStrengthAssessmentPageResult {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
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
  const [submitBusy, setSubmitBusy] = useState(false);
  const [submitNotice, setSubmitNotice] = useState<StrengthSubmitNotice | null>(null);
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
  }, []);

  useEffect(() => {
    if (!submitNotice) return;
    const timer = window.setTimeout(() => {
      setSubmitNotice(null);
      setSubmitDone(false);
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [submitNotice]);

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
        [lift]: {
          oneRepMax: res.oneRepMax,
          finalScore: res.finalScore,
          weightCapped: res.weightCapped,
          weightInputKg: res.weightInputKg,
          weightUsedKg: res.weightUsedKg,
          modelMaxKg: res.modelMaxKg,
        },
      }));
    },
    [form, profile, profileReady, clearCombined]
  );

  const strengthRadarPoints = useMemo<StrengthRadarPoint[]>(() => {
    const branchScoreByLift = new Map<StrengthLiftKey, number>();
    for (const branch of combinedBreakdown?.branches ?? []) {
      branchScoreByLift.set(branch.lift, branch.finalScore);
    }

    const liveScoreByLift = new Map<StrengthLiftKey, number>();
    for (const lift of STRENGTH_LIFT_KEYS) {
      const live = tryComputeSingleLiftStrength({ lift, form, profile, profileReady });
      if (live.ok) {
        liveScoreByLift.set(lift, live.finalScore);
      }
    }

    return STRENGTH_LIFT_KEYS.map((lift) => ({
      key: lift,
      label: t(`strength.lifts.${lift}`),
      value: branchScoreByLift.get(lift) ?? liveScoreByLift.get(lift) ?? perLiftResult[lift]?.finalScore ?? 0,
    }));
  }, [combinedBreakdown?.branches, form, perLiftResult, profile, profileReady, t]);

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
    setSubmitNotice(null);
    setSubmitDone(false);
    applyCombinedComputeResult(tryComputeStrengthAssessmentScore(computeArgs), { persist: false });
  }, [computeArgs, applyCombinedComputeResult]);

  const submitToRadar = useCallback(async () => {
    if (submitBusy) return;
    setSubmitBusy(true);
    setSubmitNotice(null);
    setSubmitDone(false);

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 420);
    });

    const result = tryComputeStrengthAssessmentScore(computeArgs);
    const ok = applyCombinedComputeResult(result, { persist: true });
    if (ok && result.ok) {
      setSubmitDone(true);
      setSubmitNotice({ kind: 'success', savedScore: result.score });
      queueStructuredProfileAfterRadarSubmit();
      navigateHomeWithResonance(navigate);
    }
    if (!ok && !result.ok) {
      setSubmitNotice({ kind: 'error', error: result.error });
    }
    setSubmitBusy(false);
  }, [applyCombinedComputeResult, computeArgs, navigate, submitBusy]);

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
    strengthRadarPoints,
    calculateCombined,
    submitBusy,
    submitNotice,
    submitDone,
    submitToRadar,
  };
}
