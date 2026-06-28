import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigateHomeWithResonance } from '../services/radarResonanceNavigation';
import {
  ARM_SIZE_BODY_FAT_MAX_PCT,
  ARM_SIZE_BODY_FAT_MIN_PCT,
  ARM_SIZE_MAX_CM,
  evaluateArmSizeScore,
} from '../logic/core/armSizeScoring';
import {
  loadArmSizeInputs,
  loadPhysicalProfile,
  saveArmSizeInputs,
  subscribePhysicalProfile,
} from '../services/localStorageService';
import { queueStructuredProfileAfterRadarSubmit } from '../services/structuredSyncAfterRadarSubmit';
import { useScoreStore } from '../stores/scoreStore';

export type ArmSizeAssessmentError =
  | 'invalid-arm-cm'
  | 'arm-exceeds-max'
  | 'invalid-body-fat'
  | 'body-fat-out-of-range';

export interface UseArmSizeAssessmentPageResult {
  armCircumferenceInput: string;
  setArmCircumferenceInput: (v: string) => void;
  bodyFatInput: string;
  setBodyFatInput: (v: string) => void;
  previewScore: number | null;
  submittedScore: number | null;
  limitedByAxisCap: boolean;
  errorKey: ArmSizeAssessmentError | null;
  submitDone: boolean;
  clearError: () => void;
  calculate: () => void;
  persistToDashboard: () => boolean;
  submitToRadar: () => void;
}

function parsePositiveNumber(raw: string): number | null {
  const n = Number(raw.trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function useArmSizeAssessmentPage(): UseArmSizeAssessmentPageResult {
  const navigate = useNavigate();
  const setStoreScore = useScoreStore((s) => s.setScore);
  const [profile, setProfile] = useState(loadPhysicalProfile);
  const [armCircumferenceInput, setArmCircumferenceInput] = useState(() => {
    const saved = loadArmSizeInputs()?.armCircumferenceCm;
    return Number.isFinite(saved) && (saved ?? 0) > 0 ? String(saved) : '';
  });
  const [bodyFatInput, setBodyFatInput] = useState(() => {
    const saved = loadArmSizeInputs()?.bodyFatPct;
    return Number.isFinite(saved) && (saved ?? 0) > 0 ? String(saved) : '20';
  });
  const [previewScore, setPreviewScore] = useState<number | null>(null);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [limitedByAxisCap, setLimitedByAxisCap] = useState(false);
  const [errorKey, setErrorKey] = useState<ArmSizeAssessmentError | null>(null);
  const [submitDone, setSubmitDone] = useState(false);

  useEffect(() => {
    const sync = () => setProfile(loadPhysicalProfile());
    return subscribePhysicalProfile(sync);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setPreviewScore(null);
      setSubmittedScore(null);
      setLimitedByAxisCap(false);
      setSubmitDone(false);
    });
  }, [armCircumferenceInput, bodyFatInput, profile?.gender]);

  const clearError = useCallback(() => setErrorKey(null), []);

  const evaluateFromInputs = useCallback(() => {
    const armCm = parsePositiveNumber(armCircumferenceInput);
    if (armCm === null) {
      return { ok: false as const, error: 'invalid-arm-cm' as const };
    }
    if (armCm > ARM_SIZE_MAX_CM) {
      return { ok: false as const, error: 'arm-exceeds-max' as const };
    }
    const bodyFatPct = parsePositiveNumber(bodyFatInput);
    if (bodyFatPct === null) {
      return { ok: false as const, error: 'invalid-body-fat' as const };
    }
    if (bodyFatPct < ARM_SIZE_BODY_FAT_MIN_PCT || bodyFatPct > ARM_SIZE_BODY_FAT_MAX_PCT) {
      return { ok: false as const, error: 'body-fat-out-of-range' as const };
    }
    const result = evaluateArmSizeScore({
      armCircumferenceCm: armCm,
      bodyFatPct,
      gender: profile?.gender,
    });
    if (!result) {
      return { ok: false as const, error: 'invalid-arm-cm' as const };
    }
    return { ok: true as const, armCm, bodyFatPct, result };
  }, [armCircumferenceInput, bodyFatInput, profile?.gender]);

  const calculate = useCallback(() => {
    setSubmitDone(false);
    setErrorKey(null);
    const evaluated = evaluateFromInputs();
    if (!evaluated.ok) {
      setErrorKey(evaluated.error);
      setPreviewScore(null);
      setSubmittedScore(null);
      setLimitedByAxisCap(false);
      return;
    }
    setPreviewScore(evaluated.result.rawScore);
    setSubmittedScore(evaluated.result.submittedScore);
    setLimitedByAxisCap(evaluated.result.limitedByAxisCap);
  }, [evaluateFromInputs]);

  const persistToDashboard = useCallback((): boolean => {
    setSubmitDone(false);
    setErrorKey(null);
    const evaluated = evaluateFromInputs();
    if (!evaluated.ok) {
      setErrorKey(evaluated.error);
      return false;
    }
    saveArmSizeInputs({
      armCircumferenceCm: evaluated.armCm,
      bodyFatPct: evaluated.bodyFatPct,
    });
    setStoreScore('armSize', evaluated.result.submittedScore);
    setPreviewScore(evaluated.result.rawScore);
    setSubmittedScore(evaluated.result.submittedScore);
    setLimitedByAxisCap(evaluated.result.limitedByAxisCap);
    setSubmitDone(true);
    queueStructuredProfileAfterRadarSubmit();
    return true;
  }, [evaluateFromInputs, setStoreScore]);

  const submitToRadar = useCallback(() => {
    if (!persistToDashboard()) return;
    navigateHomeWithResonance(navigate);
  }, [navigate, persistToDashboard]);

  return {
    armCircumferenceInput,
    setArmCircumferenceInput,
    bodyFatInput,
    setBodyFatInput,
    previewScore,
    submittedScore,
    limitedByAxisCap,
    errorKey,
    submitDone,
    clearError,
    calculate,
    persistToDashboard,
    submitToRadar,
  };
}
