import { useCallback, useEffect, useState } from 'react';
import {
  ARM_SIZE_BODY_FAT_MAX_PCT,
  ARM_SIZE_BODY_FAT_MIN_PCT,
  ARM_SIZE_MAX_CM,
  evaluateArmSizeScore,
} from '../logic/core/armSizeScoring';
import { loadArmSizeInputs, saveArmSizeInputs } from '../services/localStorageService';
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
  saveForLeaderboard: () => void;
}

function parsePositiveNumber(raw: string): number | null {
  const n = Number(raw.trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function useArmSizeAssessmentPage(): UseArmSizeAssessmentPageResult {
  const setStoreScore = useScoreStore((s) => s.setScore);
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
    queueMicrotask(() => {
      setPreviewScore(null);
      setSubmittedScore(null);
      setLimitedByAxisCap(false);
      setSubmitDone(false);
    });
  }, [armCircumferenceInput, bodyFatInput]);

  const clearError = useCallback(() => setErrorKey(null), []);

  const calculate = useCallback(() => {
    setSubmitDone(false);
    setErrorKey(null);
    const armCm = parsePositiveNumber(armCircumferenceInput);
    if (armCm === null) {
      setErrorKey('invalid-arm-cm');
      setPreviewScore(null);
      setSubmittedScore(null);
      setLimitedByAxisCap(false);
      return;
    }
    if (armCm > ARM_SIZE_MAX_CM) {
      setErrorKey('arm-exceeds-max');
      setPreviewScore(null);
      setSubmittedScore(null);
      setLimitedByAxisCap(false);
      return;
    }
    const bodyFatPct = parsePositiveNumber(bodyFatInput);
    if (bodyFatPct === null) {
      setErrorKey('invalid-body-fat');
      setPreviewScore(null);
      setSubmittedScore(null);
      setLimitedByAxisCap(false);
      return;
    }
    if (bodyFatPct < ARM_SIZE_BODY_FAT_MIN_PCT || bodyFatPct > ARM_SIZE_BODY_FAT_MAX_PCT) {
      setErrorKey('body-fat-out-of-range');
      setPreviewScore(null);
      setSubmittedScore(null);
      setLimitedByAxisCap(false);
      return;
    }
    const result = evaluateArmSizeScore({ armCircumferenceCm: armCm, bodyFatPct });
    if (!result) {
      setErrorKey('invalid-arm-cm');
      setPreviewScore(null);
      setSubmittedScore(null);
      setLimitedByAxisCap(false);
      return;
    }
    setPreviewScore(result.rawScore);
    setSubmittedScore(result.submittedScore);
    setLimitedByAxisCap(result.limitedByAxisCap);
  }, [armCircumferenceInput, bodyFatInput]);

  const saveForLeaderboard = useCallback(() => {
    setSubmitDone(false);
    setErrorKey(null);
    const armCm = parsePositiveNumber(armCircumferenceInput);
    if (armCm === null) {
      setErrorKey('invalid-arm-cm');
      return;
    }
    if (armCm > ARM_SIZE_MAX_CM) {
      setErrorKey('arm-exceeds-max');
      return;
    }
    const bodyFatPct = parsePositiveNumber(bodyFatInput);
    if (bodyFatPct === null) {
      setErrorKey('invalid-body-fat');
      return;
    }
    if (bodyFatPct < ARM_SIZE_BODY_FAT_MIN_PCT || bodyFatPct > ARM_SIZE_BODY_FAT_MAX_PCT) {
      setErrorKey('body-fat-out-of-range');
      return;
    }
    const result = evaluateArmSizeScore({ armCircumferenceCm: armCm, bodyFatPct });
    if (!result) {
      setErrorKey('invalid-arm-cm');
      return;
    }
    saveArmSizeInputs({ armCircumferenceCm: armCm, bodyFatPct });
    setStoreScore('armSize', result.submittedScore);
    setPreviewScore(result.rawScore);
    setSubmittedScore(result.submittedScore);
    setLimitedByAxisCap(result.limitedByAxisCap);
    setSubmitDone(true);
    queueStructuredProfileAfterRadarSubmit();
  }, [armCircumferenceInput, bodyFatInput, setStoreScore]);

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
    saveForLeaderboard,
  };
}
