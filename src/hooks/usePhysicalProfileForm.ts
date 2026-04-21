import type { FormEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  isPhysicalProfileComplete,
  validatePhysicalProfile,
  type PhysicalProfileValidationErrorCode,
} from '../logic/core/physicalProfile';
import {
  LOCAL_PHYSICAL_PROFILE_CHANGED_EVENT,
  loadPhysicalProfile,
  savePhysicalProfile,
} from '../services/localStorageService';
import { LADDER_COUNTRY_CODES, LADDER_JOB_CATEGORIES } from '../types/ladderProfile';

function readFormFieldsFromStorage(): {
  gender: string;
  age: string;
  heightCm: string;
  weightKg: string;
  jobCategory: string;
  weeklyTrainingHours: string;
  trainingYears: string;
  countryCode: string;
  region: string;
  city: string;
  district: string;
  isAnonymousInLadder: boolean;
} {
  const p = loadPhysicalProfile();
  if (!p) {
    return {
      gender: '',
      age: '',
      heightCm: '',
      weightKg: '',
      jobCategory: '',
      weeklyTrainingHours: '',
      trainingYears: '',
      countryCode: '',
      region: '',
      city: '',
      district: '',
      isAnonymousInLadder: false,
    };
  }
  return {
    gender: p.gender,
    age: String(p.age),
    heightCm: String(p.heightCm),
    weightKg: String(p.weightKg),
    jobCategory:
      typeof p.jobCategory === 'string' &&
      LADDER_JOB_CATEGORIES.includes(p.jobCategory as (typeof LADDER_JOB_CATEGORIES)[number])
        ? p.jobCategory
        : '',
    weeklyTrainingHours:
      typeof p.weeklyTrainingHours === 'number' ? String(p.weeklyTrainingHours) : '',
    trainingYears: typeof p.trainingYears === 'number' ? String(p.trainingYears) : '',
    countryCode:
      typeof p.countryCode === 'string' &&
      LADDER_COUNTRY_CODES.includes(p.countryCode as (typeof LADDER_COUNTRY_CODES)[number])
        ? p.countryCode
        : '',
    region: typeof p.region === 'string' ? p.region : '',
    city: typeof p.city === 'string' ? p.city : '',
    district: typeof p.district === 'string' ? p.district : '',
    isAnonymousInLadder: p.isAnonymousInLadder === true,
  };
}

export function usePhysicalProfileForm() {
  const initial = readFormFieldsFromStorage();
  const [gender, setGender] = useState(initial.gender);
  const [age, setAge] = useState(initial.age);
  const [heightCm, setHeightCm] = useState(initial.heightCm);
  const [weightKg, setWeightKg] = useState(initial.weightKg);
  const [jobCategory, setJobCategory] = useState(initial.jobCategory);
  const [weeklyTrainingHours, setWeeklyTrainingHours] = useState(initial.weeklyTrainingHours);
  const [trainingYears, setTrainingYears] = useState(initial.trainingYears);
  const [countryCode, setCountryCodeState] = useState(initial.countryCode);
  const [region, setRegion] = useState(initial.region);
  const [city, setCityState] = useState(initial.city);
  const [district, setDistrictState] = useState(initial.district);
  const [isAnonymousInLadder, setIsAnonymousInLadder] = useState(initial.isAnonymousInLadder);

  const [errorCode, setErrorCode] = useState<PhysicalProfileValidationErrorCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  /** Bumps after save / cross-tab sync so React re-reads `localStorage` for `baselineComplete`. */
  const [, setSyncGeneration] = useState(0);
  /** Browser timer id — avoid `ReturnType<typeof setTimeout>` (pulls Node `Timeout` under some TS configs). */
  const saveToastTimerRef = useRef<number | null>(null);

  const baselineComplete = isPhysicalProfileComplete(loadPhysicalProfile());

  const reloadFromStorage = useCallback(() => {
    const next = readFormFieldsFromStorage();
    setGender(next.gender);
    setAge(next.age);
    setHeightCm(next.heightCm);
    setWeightKg(next.weightKg);
    setJobCategory(next.jobCategory);
    setWeeklyTrainingHours(next.weeklyTrainingHours);
    setTrainingYears(next.trainingYears);
    setCountryCodeState(next.countryCode);
    setRegion(next.region);
    setCityState(next.city);
    setDistrictState(next.district);
    setIsAnonymousInLadder(next.isAnonymousInLadder);
    setSyncGeneration((g) => g + 1); // refreshes baselineComplete when another tab/device writes storage
  }, []);

  const setCountryCode = useCallback((next: string) => {
    setCountryCodeState(next);
    if (next === 'TW') {
      setRegion('');
      return;
    }
    setCityState('');
    setDistrictState('');
  }, []);

  const setCity = useCallback(
    (next: string) => {
      setCityState(next);
      if (countryCode === 'TW') {
        setRegion('');
      }
      setDistrictState('');
    },
    [countryCode]
  );

  const setDistrict = useCallback((next: string) => {
    setDistrictState(next);
  }, []);

  /**
   * Single effect: cross-tab sync + unmount cleanup (timer). Keeps hook order stable for HMR.
   */
  useEffect(() => {
    const onExternal = () => reloadFromStorage();
    window.addEventListener(LOCAL_PHYSICAL_PROFILE_CHANGED_EVENT, onExternal);
    return () => {
      window.removeEventListener(LOCAL_PHYSICAL_PROFILE_CHANGED_EVENT, onExternal);
      if (saveToastTimerRef.current !== null) {
        clearTimeout(saveToastTimerRef.current);
        saveToastTimerRef.current = null;
      }
    };
  }, [reloadFromStorage]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (saveToastTimerRef.current !== null) {
        clearTimeout(saveToastTimerRef.current);
        saveToastTimerRef.current = null;
      }
      setJustSaved(false);
      setErrorCode(null);
      setLoading(true);

      const result = validatePhysicalProfile({
        gender: gender === '' ? '' : gender,
        age,
        heightCm,
        weightKg,
        jobCategory,
        weeklyTrainingHours,
        trainingYears,
        countryCode,
        region,
        city,
        district,
        isAnonymousInLadder,
      });

      if (!result.ok) {
        setErrorCode(result.code);
        setLoading(false);
        return;
      }

      savePhysicalProfile(result.profile);
      setLoading(false);
      setJustSaved(true);
      setSyncGeneration((g) => g + 1);
      if (saveToastTimerRef.current !== null) {
        clearTimeout(saveToastTimerRef.current);
      }
      const toastId = window.setTimeout(() => {
        setJustSaved(false);
        saveToastTimerRef.current = null;
      }, 2400);
      saveToastTimerRef.current = toastId;
    },
    [
      gender,
      age,
      heightCm,
      weightKg,
      jobCategory,
      weeklyTrainingHours,
      trainingYears,
      countryCode,
      region,
      city,
      district,
      isAnonymousInLadder,
    ]
  );

  return {
    gender,
    setGender,
    age,
    setAge,
    heightCm,
    setHeightCm,
    weightKg,
    setWeightKg,
    jobCategory,
    setJobCategory,
    weeklyTrainingHours,
    setWeeklyTrainingHours,
    trainingYears,
    setTrainingYears,
    countryCode,
    setCountryCode,
    region,
    setRegion,
    city,
    setCity,
    district,
    setDistrict,
    isAnonymousInLadder,
    setIsAnonymousInLadder,
    errorCode,
    loading,
    justSaved,
    baselineComplete,
    handleSubmit,
  };
}
