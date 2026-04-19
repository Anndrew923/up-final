import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getExplosiveCapNoticeInterpolation,
  hasAnyExplosiveCap,
  type ExplosiveCapApplied,
  type ExplosiveCapNoticeInterpolation,
} from '../logic/core/explosiveInputCaps';
import {
  getPowerStandardsForProfile,
  tryComputeExplosiveAssessmentScore,
  type ExplosiveAssessmentComputeError,
  type ExplosivePowerBreakdown,
} from '../logic/core/powerScoring';
import { isPhysicalProfileComplete } from '../logic/core/physicalProfile';
import {
  loadPhysicalProfile,
  loadPowerInputs,
  savePowerInputs,
  subscribePhysicalProfile,
} from '../services/localStorageService';
import type { PhysicalProfile } from '../types/userProfile';
import type { PowerInputsPersisted } from '../types/powerInputs';
import { useScoreStore } from '../stores/scoreStore';

export type { ExplosiveCapNoticeInterpolation };

export type ExplosivePowerNormAnchors = NonNullable<ReturnType<typeof getPowerStandardsForProfile>>;

export type ExplosivePageErrorKey = ExplosiveAssessmentComputeError | null;

export interface UseExplosiveAssessmentPageResult {
  profile: PhysicalProfile | null;
  profileReady: boolean;
  verticalJumpInput: string;
  setVerticalJumpInput: (v: string) => void;
  standingLongJumpInput: string;
  setStandingLongJumpInput: (v: string) => void;
  sprintInput: string;
  setSprintInput: (v: string) => void;
  previewScore: number | null;
  previewBreakdown: ExplosivePowerBreakdown | null;
  /** Present after successful compute/submit when any input hit an elite model cap/floor — for i18n only. */
  capNoticeInterpolation: ExplosiveCapNoticeInterpolation | null;
  /** Resolved norm rows for the current profile (null if profile incomplete or age outside 12–80 tables). */
  powerNormAnchors: ExplosivePowerNormAnchors | null;
  submitDone: boolean;
  errorKey: ExplosivePageErrorKey;
  clearError: () => void;
  calculate: () => void;
  submitToRadar: () => void;
}

function resolveExplosiveCapNoticeInterpolation(
  profile: PhysicalProfile | null,
  capApplied: ExplosiveCapApplied
): ExplosiveCapNoticeInterpolation | null {
  if (!profile || !hasAnyExplosiveCap(capApplied)) return null;
  return getExplosiveCapNoticeInterpolation(profile, capApplied);
}

function mergePersisted(): PowerInputsPersisted {
  return loadPowerInputs() ?? {};
}

function readInitialForm(): {
  verticalJump: string;
  standingLongJump: string;
  sprint: string;
} {
  const raw = mergePersisted().explosivePower;
  return {
    verticalJump:
      raw?.verticalJumpCm !== undefined && raw.verticalJumpCm !== null
        ? String(raw.verticalJumpCm)
        : '',
    standingLongJump:
      raw?.standingLongJumpCm !== undefined && raw.standingLongJumpCm !== null
        ? String(raw.standingLongJumpCm)
        : '',
    sprint:
      raw?.sprintSeconds !== undefined && raw.sprintSeconds !== null ? String(raw.sprintSeconds) : '',
  };
}

export function useExplosiveAssessmentPage(): UseExplosiveAssessmentPageResult {
  const setStoreScore = useScoreStore((s) => s.setScore);
  const [profile, setProfile] = useState(loadPhysicalProfile);
  const [form, setForm] = useState(() => readInitialForm());
  const verticalJumpInput = form.verticalJump;
  const standingLongJumpInput = form.standingLongJump;
  const sprintInput = form.sprint;
  const setVerticalJumpInput = useCallback((v: string) => {
    setForm((f) => ({ ...f, verticalJump: v }));
  }, []);
  const setStandingLongJumpInput = useCallback((v: string) => {
    setForm((f) => ({ ...f, standingLongJump: v }));
  }, []);
  const setSprintInput = useCallback((v: string) => {
    setForm((f) => ({ ...f, sprint: v }));
  }, []);

  const [previewScore, setPreviewScore] = useState<number | null>(null);
  const [previewBreakdown, setPreviewBreakdown] = useState<ExplosivePowerBreakdown | null>(null);
  const [capNoticeInterpolation, setCapNoticeInterpolation] =
    useState<ExplosiveCapNoticeInterpolation | null>(null);
  const [submitDone, setSubmitDone] = useState(false);
  const [errorKey, setErrorKey] = useState<ExplosivePageErrorKey>(null);

  const profileReady = isPhysicalProfileComplete(profile);

  const powerNormAnchors = useMemo((): ExplosivePowerNormAnchors | null => {
    if (!profileReady || !profile) return null;
    return getPowerStandardsForProfile(profile);
  }, [profile, profileReady]);

  /** Inputs or baseline (age/sex/height/weight) change → prior preview is no longer valid. */
  useEffect(() => {
    queueMicrotask(() => {
      setPreviewScore(null);
      setPreviewBreakdown(null);
      setCapNoticeInterpolation(null);
      setSubmitDone(false);
      setErrorKey(null);
    });
  }, [verticalJumpInput, standingLongJumpInput, sprintInput, profile]);

  useEffect(() => {
    const sync = () => setProfile(loadPhysicalProfile());
    return subscribePhysicalProfile(sync);
  }, []);

  const clearError = useCallback(() => setErrorKey(null), []);

  const applySuccessfulExplosivePreview = useCallback(
    (result: {
      score: number;
      breakdown: ExplosivePowerBreakdown;
      capApplied: ExplosiveCapApplied;
    }) => {
      setPreviewScore(result.score);
      setPreviewBreakdown(result.breakdown);
      setCapNoticeInterpolation(resolveExplosiveCapNoticeInterpolation(profile, result.capApplied));
    },
    [profile]
  );

  const calculate = useCallback(() => {
    setSubmitDone(false);
    setErrorKey(null);
    const result = tryComputeExplosiveAssessmentScore({
      verticalJumpInput,
      standingLongJumpInput,
      sprintInput,
      profile,
      profileReady,
    });
    if (!result.ok) {
      setErrorKey(result.error);
      setPreviewScore(null);
      setPreviewBreakdown(null);
      setCapNoticeInterpolation(null);
      return;
    }
    applySuccessfulExplosivePreview(result);
  }, [
    verticalJumpInput,
    standingLongJumpInput,
    sprintInput,
    profile,
    profileReady,
    applySuccessfulExplosivePreview,
  ]);

  const submitToRadar = useCallback(() => {
    setSubmitDone(false);
    setErrorKey(null);
    const result = tryComputeExplosiveAssessmentScore({
      verticalJumpInput,
      standingLongJumpInput,
      sprintInput,
      profile,
      profileReady,
    });
    if (!result.ok) {
      setErrorKey(result.error);
      setPreviewScore(null);
      setPreviewBreakdown(null);
      setCapNoticeInterpolation(null);
      return;
    }

    const prev = mergePersisted();
    savePowerInputs({
      ...prev,
      explosivePower: result.persisted,
    });
    setStoreScore('explosivePower', result.score);
    applySuccessfulExplosivePreview(result);
    setSubmitDone(true);
  }, [
    verticalJumpInput,
    standingLongJumpInput,
    sprintInput,
    profile,
    profileReady,
    setStoreScore,
    applySuccessfulExplosivePreview,
  ]);

  return {
    profile,
    profileReady,
    verticalJumpInput,
    setVerticalJumpInput,
    standingLongJumpInput,
    setStandingLongJumpInput,
    sprintInput,
    setSprintInput,
    previewScore,
    previewBreakdown,
    capNoticeInterpolation,
    powerNormAnchors,
    submitDone,
    errorKey,
    clearError,
    calculate,
    submitToRadar,
  };
}
