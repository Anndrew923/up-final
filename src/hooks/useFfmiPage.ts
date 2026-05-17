import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PhysicalProfile } from '../types/userProfile';
import { ROUTES } from '../config/routes';
import {
  evaluateFfmiScoring,
  parseFfmiBodyFatPctInput,
  getFfmiFemaleCategorySuffix,
  getFfmiMaleCategorySuffix,
  type FfmiFemaleCategorySuffix,
  type FfmiMaleCategorySuffix,
  type FfmiScoringBreakdown,
} from '../logic/core/ffmiScoring';
import { isPhysicalProfileComplete } from '../logic/core/physicalProfile';
import {
  loadFfmiDraft,
  loadPhysicalProfile,
  saveFfmiDraft,
  subscribePhysicalProfile,
} from '../services/localStorageService';
import { navigateHomeWithResonance } from '../services/radarResonanceNavigation';
import { queueStructuredProfileAfterRadarSubmit } from '../services/structuredSyncAfterRadarSubmit';
import { useScoreStore } from '../stores/scoreStore';

export type FfmiPageErrorKey =
  | 'missing-body-fat'
  | 'invalid-body-fat'
  | 'missing-profile'
  | 'need-calculate'
  | 'world-record-lock';

export type FfmiCategorySuffix = FfmiMaleCategorySuffix | FfmiFemaleCategorySuffix;

export interface UseFfmiPageResult {
  profileReady: boolean;
  gender: 'male' | 'female' | null;
  bodyFatInput: string;
  setBodyFatInput: (v: string) => void;
  /** Radar score when eligible; uncapped formula score when world-record locked (for tier copy). */
  previewScore: number | null;
  breakdown: FfmiScoringBreakdown | null;
  categorySuffix: FfmiCategorySuffix | null;
  submitDone: boolean;
  errorKey: FfmiPageErrorKey | null;
  calculate: () => void;
  submitToRadar: () => void;
  clearError: () => void;
  goHome: () => void;
}

export function useFfmiPage(): UseFfmiPageResult {
  const navigate = useNavigate();
  const setScore = useScoreStore((s) => s.setScore);

  const [profile, setProfile] = useState<PhysicalProfile | null>(() => loadPhysicalProfile());
  const [bodyFatInput, setBodyFatInputState] = useState(
    () => loadFfmiDraft()?.bodyFatPctInput ?? ''
  );
  const [breakdown, setBreakdown] = useState<FfmiScoringBreakdown | null>(null);
  const [submitDone, setSubmitDone] = useState(false);
  const [errorKey, setErrorKey] = useState<FfmiPageErrorKey | null>(null);

  useEffect(() => {
    let sawUpdatedAtOnce = false;
    let lastUpdatedAt = '';

    const sync = () => {
      const p = loadPhysicalProfile();
      const at = p?.updatedAt ?? '';

      setProfile(p);

      if (sawUpdatedAtOnce && at !== lastUpdatedAt) {
        setBreakdown(null);
        setSubmitDone(false);
        setErrorKey(null);
      }
      sawUpdatedAtOnce = true;
      lastUpdatedAt = at;
    };

    sync();
    return subscribePhysicalProfile(sync);
  }, []);

  const profileReady = isPhysicalProfileComplete(profile);

  const categorySuffix = useMemo(() => {
    if (!breakdown || !profile) return null;
    return profile.gender === 'male'
      ? getFfmiMaleCategorySuffix(breakdown.rawAdjustedFfmi)
      : getFfmiFemaleCategorySuffix(breakdown.rawAdjustedFfmi);
  }, [breakdown, profile]);

  const previewScore = useMemo(() => {
    if (!breakdown) return null;
    return breakdown.allowsRadarSubmit ? breakdown.submittedScore : breakdown.uncappedScore;
  }, [breakdown]);

  const clearError = useCallback(() => setErrorKey(null), []);

  const setBodyFatInput = useCallback((v: string) => {
    setBodyFatInputState(v);
    saveFfmiDraft({ bodyFatPctInput: v });
    setBreakdown(null);
    setSubmitDone(false);
    setErrorKey(null);
  }, []);

  const calculate = useCallback(() => {
    setErrorKey(null);
    if (!profileReady || !profile) {
      setErrorKey('missing-profile');
      setBreakdown(null);
      return;
    }
    if (bodyFatInput.trim() === '') {
      setErrorKey('missing-body-fat');
      setBreakdown(null);
      return;
    }
    const pct = parseFfmiBodyFatPctInput(bodyFatInput.trim());
    if (pct === null) {
      setErrorKey('invalid-body-fat');
      setBreakdown(null);
      return;
    }

    const next = evaluateFfmiScoring({
      gender: profile.gender,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      bodyFatPct: pct,
    });
    setBreakdown(next);
    setSubmitDone(false);
  }, [bodyFatInput, profile, profileReady]);

  const submitToRadar = useCallback(() => {
    setErrorKey(null);
    if (!breakdown) {
      setErrorKey('need-calculate');
      return;
    }
    if (!breakdown.allowsRadarSubmit) {
      setErrorKey('world-record-lock');
      return;
    }
    setScore('bodyFat', breakdown.submittedScore);
    setSubmitDone(true);
    queueStructuredProfileAfterRadarSubmit();
    navigateHomeWithResonance(navigate);
  }, [breakdown, navigate, setScore]);

  const goHome = useCallback(() => {
    navigate(ROUTES.home);
  }, [navigate]);

  return {
    profileReady,
    gender: profile && profileReady ? profile.gender : null,
    bodyFatInput,
    setBodyFatInput,
    previewScore,
    breakdown,
    categorySuffix,
    submitDone,
    errorKey,
    calculate,
    submitToRadar,
    clearError,
    goHome,
  };
}
