import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  applyGripPeakCap,
  calculateGripStrengthScore,
  GRIP_MAX_PEAK_KG,
} from '../logic/core/gripStrength';
import { isPhysicalProfileComplete } from '../logic/core/physicalProfile';
import { clampScoreMapValue } from '../logic/core/scoring';
import {
  formatWeightInput,
  parseInputToMetric,
  reprojectDisplayInput,
  type UnitSystem,
} from '../logic/core/unitConverters';
import {
  loadGripInputs,
  loadPhysicalProfile,
  saveGripInputs,
  subscribePhysicalProfile,
} from '../services/localStorageService';
import { navigateHomeWithResonance } from '../services/radarResonanceNavigation';
import { queueStructuredProfileAfterRadarSubmit } from '../services/structuredSyncAfterRadarSubmit';
import { useScoreStore } from '../stores/scoreStore';
import { useUnitPreferenceStore } from '../stores/unitPreferenceStore';
import type { PhysicalProfile } from '../types/userProfile';

export type GripAssessmentError = 'missing-profile' | 'invalid-peak';

export interface UseGripAssessmentPageResult {
  profile: PhysicalProfile | null;
  profileReady: boolean;
  /** Peak grip in the active display unit (kg or lb). Persist path converts to kg. */
  peakInput: string;
  setPeakInput: (v: string) => void;
  previewScore: number | null;
  /** Cap notice always carries metric kg — page projects for display. */
  capNotice: { inputKg: number; maxKg: number } | null;
  errorKey: GripAssessmentError | null;
  submitDone: boolean;
  clearError: () => void;
  calculate: () => void;
  persistToDashboard: () => boolean;
  submitToRadar: () => void;
}

function readInitialPeakInput(unitSystem: UnitSystem): string {
  const saved = loadGripInputs()?.peakKg;
  if (!Number.isFinite(saved) || (saved ?? 0) <= 0) return '';
  return formatWeightInput(saved!, unitSystem);
}

function parsePeakKg(raw: string, unitSystem: UnitSystem): number | null {
  const kg = parseInputToMetric(raw, 'weight', unitSystem);
  if (kg === null || kg <= 0) return null;
  return kg;
}

export function useGripAssessmentPage(): UseGripAssessmentPageResult {
  const navigate = useNavigate();
  const setStoreScore = useScoreStore((s) => s.setScore);
  const unitSystem = useUnitPreferenceStore((s) => s.unitSystem);
  const prevUnitSystemRef = useRef(unitSystem);
  const [profile, setProfile] = useState(loadPhysicalProfile);
  const [peakInput, setPeakInput] = useState(() => readInitialPeakInput(unitSystem));
  const [previewScore, setPreviewScore] = useState<number | null>(null);
  const [capNotice, setCapNotice] = useState<{ inputKg: number; maxKg: number } | null>(null);
  const [errorKey, setErrorKey] = useState<GripAssessmentError | null>(null);
  const [submitDone, setSubmitDone] = useState(false);

  const profileReady = isPhysicalProfileComplete(profile);

  useEffect(() => {
    const sync = () => setProfile(loadPhysicalProfile());
    return subscribePhysicalProfile(sync);
  }, []);

  useEffect(() => {
    const prev = prevUnitSystemRef.current;
    if (prev === unitSystem) return;
    prevUnitSystemRef.current = unitSystem;
    setPeakInput((raw) => reprojectDisplayInput(raw, 'weight', prev, unitSystem));
  }, [unitSystem]);

  useEffect(() => {
    queueMicrotask(() => {
      setPreviewScore(null);
      setCapNotice(null);
      setSubmitDone(false);
    });
  }, [peakInput, profile, unitSystem]);

  const clearError = useCallback(() => setErrorKey(null), []);

  const calculate = useCallback(() => {
    setSubmitDone(false);
    setErrorKey(null);
    if (!profileReady || !profile) {
      setErrorKey('missing-profile');
      setPreviewScore(null);
      return;
    }
    const peakKg = parsePeakKg(peakInput, unitSystem);
    if (peakKg === null) {
      setErrorKey('invalid-peak');
      setPreviewScore(null);
      setCapNotice(null);
      return;
    }
    const capped = applyGripPeakCap(peakKg);
    const score = calculateGripStrengthScore(peakKg, profile.weightKg, profile.gender);
    setPreviewScore(score);
    setCapNotice(capped.capped ? { inputKg: capped.inputKg, maxKg: GRIP_MAX_PEAK_KG } : null);
  }, [peakInput, profile, profileReady, unitSystem]);

  const persistToDashboard = useCallback((): boolean => {
    setSubmitDone(false);
    setErrorKey(null);
    if (!profileReady || !profile) {
      setErrorKey('missing-profile');
      return false;
    }
    const peakKg = parsePeakKg(peakInput, unitSystem);
    if (peakKg === null) {
      setErrorKey('invalid-peak');
      return false;
    }
    const capped = applyGripPeakCap(peakKg);
    const score = calculateGripStrengthScore(peakKg, profile.weightKg, profile.gender);
    // WHY: Always persist metric kg so unit toggles never rewrite the stored source of truth.
    saveGripInputs({ peakKg: capped.usedKg, genderSnapshot: profile.gender });
    setStoreScore('gripStrength', clampScoreMapValue(score));
    setPreviewScore(score);
    setCapNotice(capped.capped ? { inputKg: capped.inputKg, maxKg: GRIP_MAX_PEAK_KG } : null);
    setSubmitDone(true);
    queueStructuredProfileAfterRadarSubmit();
    return true;
  }, [peakInput, profile, profileReady, setStoreScore, unitSystem]);

  const submitToRadar = useCallback(() => {
    if (!persistToDashboard()) return;
    navigateHomeWithResonance(navigate);
  }, [navigate, persistToDashboard]);

  return {
    profile,
    profileReady,
    peakInput,
    setPeakInput,
    previewScore,
    capNotice,
    errorKey,
    submitDone,
    clearError,
    calculate,
    persistToDashboard,
    submitToRadar,
  };
}
