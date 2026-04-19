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

function readFormFieldsFromStorage(): {
  gender: string;
  age: string;
  heightCm: string;
  weightKg: string;
} {
  const p = loadPhysicalProfile();
  if (!p) {
    return { gender: '', age: '', heightCm: '', weightKg: '' };
  }
  return {
    gender: p.gender,
    age: String(p.age),
    heightCm: String(p.heightCm),
    weightKg: String(p.weightKg),
  };
}

export function usePhysicalProfileForm() {
  const initial = readFormFieldsFromStorage();
  const [gender, setGender] = useState(initial.gender);
  const [age, setAge] = useState(initial.age);
  const [heightCm, setHeightCm] = useState(initial.heightCm);
  const [weightKg, setWeightKg] = useState(initial.weightKg);

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
    setSyncGeneration((g) => g + 1); // refreshes baselineComplete when another tab/device writes storage
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
    [gender, age, heightCm, weightKg]
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
    errorCode,
    loading,
    justSaved,
    baselineComplete,
    handleSubmit,
  };
}
