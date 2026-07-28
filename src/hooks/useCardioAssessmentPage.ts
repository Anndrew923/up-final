import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCooperMaxDistanceMetersForGender,
  parse5KmFieldSplit,
  parseCooperDistanceMeters,
  resolveCardioScoreForDisplay,
  tryComputeCardioAssessmentScore,
  type CardioAssessmentComputeError,
  type CardioAssessmentTab,
} from '../logic/core/cardioScoring';
import { clampScoreMapValue } from '../logic/core/scoring';
import { isPhysicalProfileComplete } from '../logic/core/physicalProfile';
import {
  loadCardioActiveTab,
  loadCardioInputs,
  loadPhysicalProfile,
  saveCardioActiveTab,
  saveCardioInputs,
  subscribePhysicalProfile,
} from '../services/localStorageService';
import { navigateHomeWithResonance } from '../services/radarResonanceNavigation';
import { queueStructuredProfileAfterRadarSubmit } from '../services/structuredSyncAfterRadarSubmit';
import type { CardioInputsPersisted } from '../types/cardioInputs';
import { useScoreStore } from '../stores/scoreStore';

/** Page/hook alias — same union as `CardioAssessmentTab` in scoring core. */
export type CardioTab = CardioAssessmentTab;

export type CardioPageErrorKey = CardioAssessmentComputeError | null;

export interface UseCardioAssessmentPageResult {
  profileReady: boolean;
  /** Cooper tab only: parsed distance exceeds world-record-aligned model ceiling. */
  cooperDistanceOverCap: boolean;
  cooperCapMeters: number | null;
  activeTab: CardioTab;
  setActiveTab: (t: CardioTab) => void;
  distanceInput: string;
  setDistanceInput: (v: string) => void;
  runMinutesInput: string;
  setRunMinutesInput: (v: string) => void;
  runSecondsInput: string;
  setRunSecondsInput: (v: string) => void;
  previewScore: number | null;
  submitDone: boolean;
  errorKey: CardioPageErrorKey;
  clearError: () => void;
  calculate: () => void;
  persistToDashboard: () => boolean;
  /**
   * Persist active tab (Cooper → radar axis + home resonance; 5 km → specialty only).
   * WHY: Name reflects tab-scoped submit, not “always write radar”.
   */
  submitAssessment: () => void;
}

function mergePersisted(): CardioInputsPersisted {
  return loadCardioInputs() ?? {};
}

function readInitialCardioForm(): { distance: string; minutes: string; seconds: string } {
  const raw = mergePersisted();
  const d = raw.cardio?.distance;
  const r5 = raw.run_5km;
  return {
    distance: d !== undefined && d !== null ? String(d) : '',
    minutes: r5?.minutes !== undefined ? String(r5.minutes) : '',
    seconds: r5?.seconds !== undefined ? String(r5.seconds) : '',
  };
}

export function useCardioAssessmentPage(): UseCardioAssessmentPageResult {
  const navigate = useNavigate();
  const setStoreScore = useScoreStore((s) => s.setScore);

  const [profile, setProfile] = useState(loadPhysicalProfile);
  const [activeTab, setActiveTabState] = useState<CardioTab>(() => loadCardioActiveTab());

  const [form, setForm] = useState(() => readInitialCardioForm());
  const distanceInput = form.distance;
  const runMinutesInput = form.minutes;
  const runSecondsInput = form.seconds;
  const setDistanceInput = useCallback((v: string) => {
    setForm((f) => ({ ...f, distance: v }));
  }, []);
  const setRunMinutesInput = useCallback((v: string) => {
    setForm((f) => ({ ...f, minutes: v }));
  }, []);
  const setRunSecondsInput = useCallback((v: string) => {
    setForm((f) => ({ ...f, seconds: v }));
  }, []);

  const [previewScore, setPreviewScore] = useState<number | null>(null);
  const [submitDone, setSubmitDone] = useState(false);
  const [errorKey, setErrorKey] = useState<CardioPageErrorKey>(null);
  /** Specialty 5 km must not trigger home radar resonance. */
  const lastPersistWroteRadarAxisRef = useRef(false);

  const profileReady = isPhysicalProfileComplete(profile);

  const cooperCapMeters =
    profileReady && profile ? getCooperMaxDistanceMetersForGender(profile.gender) : null;
  const cooperParsed = parseCooperDistanceMeters(distanceInput);
  const cooperDistanceOverCap =
    activeTab === 'cooper' &&
    cooperCapMeters !== null &&
    cooperParsed !== null &&
    cooperParsed > cooperCapMeters;

  useEffect(() => {
    const sync = () => setProfile(loadPhysicalProfile());
    return subscribePhysicalProfile(sync);
  }, []);

  const setActiveTab = useCallback((tab: CardioTab) => {
    setActiveTabState(tab);
    saveCardioActiveTab(tab);
    setPreviewScore(null);
    setErrorKey(null);
    setSubmitDone(false);
  }, []);

  const clearError = useCallback(() => setErrorKey(null), []);

  const calculate = useCallback(() => {
    setSubmitDone(false);
    setErrorKey(null);

    const result = tryComputeCardioAssessmentScore({
      tab: activeTab,
      distanceInput,
      runMinutesInput,
      runSecondsInput,
      profile,
      profileReady,
    });

    if (!result.ok) {
      setErrorKey(result.error);
      setPreviewScore(null);
      return;
    }
    setPreviewScore(result.score);
  }, [activeTab, distanceInput, profile, profileReady, runMinutesInput, runSecondsInput]);

  const persistToDashboard = useCallback((): boolean => {
    setSubmitDone(false);
    setErrorKey(null);

    const result = tryComputeCardioAssessmentScore({
      tab: activeTab,
      distanceInput,
      runMinutesInput,
      runSecondsInput,
      profile,
      profileReady,
    });

    if (!result.ok) {
      setErrorKey(result.error);
      return false;
    }

    const scoreToSave = clampScoreMapValue(result.score);
    const prev = mergePersisted();

    if (activeTab === 'cooper') {
      const d = parseCooperDistanceMeters(distanceInput);
      if (d === null) {
        setErrorKey('invalid-cooper-distance');
        return false;
      }
      const maxM = getCooperMaxDistanceMetersForGender(profile!.gender);
      const savedDistance = Math.min(d, maxM);
      saveCardioInputs({
        ...prev,
        cardio: { distance: savedDistance },
      });
      setStoreScore('cardio', scoreToSave);
      lastPersistWroteRadarAxisRef.current = true;
      setSubmitDone(true);
      queueStructuredProfileAfterRadarSubmit();
      return true;
    }

    const split = parse5KmFieldSplit(runMinutesInput, runSecondsInput);
    if (!split) {
      setErrorKey('invalid-5km-time');
      return false;
    }
    const paceInSeconds = Math.round(split.totalSeconds / 5);
    const nextInputs: CardioInputsPersisted = {
      ...prev,
      run_5km: {
        minutes: split.minutes,
        seconds: split.seconds,
        totalSeconds: split.totalSeconds,
        paceInSeconds,
      },
    };
    saveCardioInputs(nextInputs);
    // WHY: 5 km is specialty-only — keep Cooper-derived axis if present, else clear stale fallback.
    const axis = resolveCardioScoreForDisplay(profile, nextInputs);
    setStoreScore('cardio', axis != null ? clampScoreMapValue(axis) : 0);
    lastPersistWroteRadarAxisRef.current = false;
    setSubmitDone(true);
    queueStructuredProfileAfterRadarSubmit();
    return true;
  }, [activeTab, distanceInput, profile, profileReady, runMinutesInput, runSecondsInput, setStoreScore]);

  const submitAssessment = useCallback(() => {
    if (!persistToDashboard()) return;
    if (!lastPersistWroteRadarAxisRef.current) return;
    navigateHomeWithResonance(navigate);
  }, [navigate, persistToDashboard]);

  return {
    profileReady,
    cooperDistanceOverCap,
    cooperCapMeters,
    activeTab,
    setActiveTab,
    distanceInput,
    setDistanceInput,
    runMinutesInput,
    setRunMinutesInput,
    runSecondsInput,
    setRunSecondsInput,
    previewScore,
    submitDone,
    errorKey,
    clearError,
    calculate,
    persistToDashboard,
    submitAssessment,
  };
}
