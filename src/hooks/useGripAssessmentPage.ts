import { useCallback, useEffect, useState } from 'react';
import {
  applyGripPeakCap,
  calculateGripStrengthScore,
  getGripRankMetadata,
  GRIP_MAX_PEAK_KG,
  type GripRankMetadata,
} from '../logic/core/gripStrength';
import { isPhysicalProfileComplete } from '../logic/core/physicalProfile';
import { clampScoreMapValue } from '../logic/core/scoring';
import {
  loadGripInputs,
  loadPhysicalProfile,
  saveGripInputs,
  subscribePhysicalProfile,
} from '../services/localStorageService';
import { useScoreStore } from '../stores/scoreStore';
import type { PhysicalProfile } from '../types/userProfile';

export type GripAssessmentError = 'missing-profile' | 'invalid-peak';

export interface UseGripAssessmentPageResult {
  profile: PhysicalProfile | null;
  profileReady: boolean;
  peakKgInput: string;
  setPeakKgInput: (v: string) => void;
  previewScore: number | null;
  rankMetadata: GripRankMetadata | null;
  capNotice: { inputKg: number; maxKg: number } | null;
  errorKey: GripAssessmentError | null;
  submitDone: boolean;
  clearError: () => void;
  calculate: () => void;
  submitToRadar: () => void;
}

function parsePeakKg(raw: string): number | null {
  const n = Number(raw.trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function useGripAssessmentPage(): UseGripAssessmentPageResult {
  const setStoreScore = useScoreStore((s) => s.setScore);
  const [profile, setProfile] = useState(loadPhysicalProfile);
  const [peakKgInput, setPeakKgInput] = useState(() => {
    const saved = loadGripInputs()?.peakKg;
    return Number.isFinite(saved) && (saved ?? 0) > 0 ? String(saved) : '';
  });
  const [previewScore, setPreviewScore] = useState<number | null>(null);
  const [rankMetadata, setRankMetadata] = useState<GripRankMetadata | null>(null);
  const [capNotice, setCapNotice] = useState<{ inputKg: number; maxKg: number } | null>(null);
  const [errorKey, setErrorKey] = useState<GripAssessmentError | null>(null);
  const [submitDone, setSubmitDone] = useState(false);

  const profileReady = isPhysicalProfileComplete(profile);

  useEffect(() => {
    const sync = () => setProfile(loadPhysicalProfile());
    return subscribePhysicalProfile(sync);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setPreviewScore(null);
      setRankMetadata(null);
      setCapNotice(null);
      setSubmitDone(false);
    });
  }, [peakKgInput, profile]);

  const clearError = useCallback(() => setErrorKey(null), []);

  const calculate = useCallback(() => {
    setSubmitDone(false);
    setErrorKey(null);
    if (!profileReady || !profile) {
      setErrorKey('missing-profile');
      setPreviewScore(null);
      setRankMetadata(null);
      return;
    }
    const peakKg = parsePeakKg(peakKgInput);
    if (peakKg === null) {
      setErrorKey('invalid-peak');
      setPreviewScore(null);
      setRankMetadata(null);
      setCapNotice(null);
      return;
    }
    const capped = applyGripPeakCap(peakKg);
    const score = calculateGripStrengthScore(peakKg, profile.gender);
    setPreviewScore(score);
    setRankMetadata(getGripRankMetadata(score));
    setCapNotice(capped.capped ? { inputKg: capped.inputKg, maxKg: GRIP_MAX_PEAK_KG } : null);
  }, [peakKgInput, profile, profileReady]);

  const submitToRadar = useCallback(() => {
    setSubmitDone(false);
    setErrorKey(null);
    if (!profileReady || !profile) {
      setErrorKey('missing-profile');
      return;
    }
    const peakKg = parsePeakKg(peakKgInput);
    if (peakKg === null) {
      setErrorKey('invalid-peak');
      return;
    }
    const capped = applyGripPeakCap(peakKg);
    const score = calculateGripStrengthScore(peakKg, profile.gender);
    saveGripInputs({ peakKg: capped.usedKg, genderSnapshot: profile.gender });
    setStoreScore('gripStrength', clampScoreMapValue(score));
    setPreviewScore(score);
    setRankMetadata(getGripRankMetadata(score));
    setCapNotice(capped.capped ? { inputKg: capped.inputKg, maxKg: GRIP_MAX_PEAK_KG } : null);
    setSubmitDone(true);
  }, [peakKgInput, profile, profileReady, setStoreScore]);

  return {
    profile,
    profileReady,
    peakKgInput,
    setPeakKgInput,
    previewScore,
    rankMetadata,
    capNotice,
    errorKey,
    submitDone,
    clearError,
    calculate,
    submitToRadar,
  };
}
