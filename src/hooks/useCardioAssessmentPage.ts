import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  COOPER_MAX_DISTANCE_FEMALE_METERS,
  COOPER_MAX_DISTANCE_MALE_METERS,
  getCooperMaxDistanceMetersForGender,
  parse5KmFieldSplit,
  parseCooperDistanceMeters,
  tryComputeCardioAssessmentScore,
  type CardioAssessmentComputeError,
} from '../logic/core/cardioScoring';
import { clampScoreMapValue } from '../logic/core/scoring';
import { isPhysicalProfileComplete } from '../logic/core/physicalProfile';
import {
  loadCardioInputs,
  loadPhysicalProfile,
  saveCardioInputs,
  subscribePhysicalProfile,
} from '../services/localStorageService';
import { navigateHomeWithResonance } from '../services/radarResonanceNavigation';
import { queueStructuredProfileAfterRadarSubmit } from '../services/structuredSyncAfterRadarSubmit';
import type { CardioInputsPersisted } from '../types/cardioInputs';
import { useScoreStore } from '../stores/scoreStore';

export type CardioTab = 'cooper' | '5km';

export type CardioPageErrorKey = CardioAssessmentComputeError | null;

export interface UseCardioAssessmentPageResult {
  profileReady: boolean;
  /** Cooper tab only: parsed distance exceeds world-record-aligned model ceiling. */
  cooperDistanceOverCap: boolean;
  cooperCapMeters: number | null;
  cooperHintCaps: { maleCap: number; femaleCap: number };
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
  submitToRadar: () => void;
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
  const [activeTab, setActiveTabState] = useState<CardioTab>('cooper');

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
    saveCardioInputs({
      ...prev,
      run_5km: {
        minutes: split.minutes,
        seconds: split.seconds,
        totalSeconds: split.totalSeconds,
        paceInSeconds,
      },
    });
    setStoreScore('cardio', scoreToSave);
    setSubmitDone(true);
    queueStructuredProfileAfterRadarSubmit();
    return true;
  }, [activeTab, distanceInput, profile, profileReady, runMinutesInput, runSecondsInput, setStoreScore]);

  const submitToRadar = useCallback(() => {
    if (!persistToDashboard()) return;
    navigateHomeWithResonance(navigate);
  }, [navigate, persistToDashboard]);

  return {
    profileReady,
    cooperDistanceOverCap,
    cooperCapMeters,
    cooperHintCaps: {
      maleCap: COOPER_MAX_DISTANCE_MALE_METERS,
      femaleCap: COOPER_MAX_DISTANCE_FEMALE_METERS,
    },
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
    submitToRadar,
  };
}
