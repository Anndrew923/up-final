import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  type ExplosivePowerNormAnchors,
} from '../logic/core/powerScoring';
import { isPhysicalProfileComplete } from '../logic/core/physicalProfile';
import {
  formatLengthInput,
  parseInputToMetric,
  reprojectDisplayInput,
  type UnitSystem,
} from '../logic/core/unitConverters';
import {
  loadPhysicalProfile,
  loadPowerInputs,
  savePowerInputs,
  subscribePhysicalProfile,
} from '../services/localStorageService';
import { navigateHomeWithResonance } from '../services/radarResonanceNavigation';
import { queueStructuredProfileAfterRadarSubmit } from '../services/structuredSyncAfterRadarSubmit';
import type { PhysicalProfile } from '../types/userProfile';
import type { PowerInputsPersisted } from '../types/powerInputs';
import { useScoreStore } from '../stores/scoreStore';
import { useUnitPreferenceStore } from '../stores/unitPreferenceStore';

export type { ExplosiveCapNoticeInterpolation };
export type { ExplosivePowerNormAnchors };

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
  /**
   * Metric (cm / s) strings for scoring + ladder supplemental builders.
   * WHY: UI may show inches; core formulas and Firestore summaries stay metric-only.
   */
  metricScoringInputs: {
    verticalJumpInput: string;
    standingLongJumpInput: string;
    sprintInput: string;
  };
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
  persistToDashboard: () => boolean;
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

/** Empty stays empty; invalid stays as-is so core validators surface the right error. */
function toMetricLengthField(raw: string, unitSystem: UnitSystem): string {
  const trimmed = raw.trim();
  if (trimmed === '') return '';
  const cm = parseInputToMetric(trimmed, 'length', unitSystem);
  if (cm === null) return raw;
  return String(cm);
}

function readInitialForm(unitSystem: UnitSystem): {
  verticalJump: string;
  standingLongJump: string;
  sprint: string;
} {
  const raw = mergePersisted().explosivePower;
  return {
    verticalJump:
      raw?.verticalJumpCm !== undefined && raw.verticalJumpCm !== null
        ? formatLengthInput(raw.verticalJumpCm, unitSystem)
        : '',
    standingLongJump:
      raw?.standingLongJumpCm !== undefined && raw.standingLongJumpCm !== null
        ? formatLengthInput(raw.standingLongJumpCm, unitSystem)
        : '',
    sprint:
      raw?.sprintSeconds !== undefined && raw.sprintSeconds !== null
        ? String(raw.sprintSeconds)
        : '',
  };
}

export function useExplosiveAssessmentPage(): UseExplosiveAssessmentPageResult {
  const navigate = useNavigate();
  const setStoreScore = useScoreStore((s) => s.setScore);
  const unitSystem = useUnitPreferenceStore((s) => s.unitSystem);
  const prevUnitSystemRef = useRef(unitSystem);
  const [profile, setProfile] = useState(loadPhysicalProfile);
  const [form, setForm] = useState(() => readInitialForm(unitSystem));
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

  const metricScoringInputs = useMemo(
    () => ({
      verticalJumpInput: toMetricLengthField(verticalJumpInput, unitSystem),
      standingLongJumpInput: toMetricLengthField(standingLongJumpInput, unitSystem),
      sprintInput,
    }),
    [sprintInput, standingLongJumpInput, unitSystem, verticalJumpInput]
  );

  const powerNormAnchors = useMemo((): ExplosivePowerNormAnchors | null => {
    if (!profileReady || !profile) return null;
    return getPowerStandardsForProfile(profile);
  }, [profile, profileReady]);

  useEffect(() => {
    const prev = prevUnitSystemRef.current;
    if (prev === unitSystem) return;
    prevUnitSystemRef.current = unitSystem;
    setForm((f) => ({
      ...f,
      verticalJump: reprojectDisplayInput(f.verticalJump, 'length', prev, unitSystem),
      standingLongJump: reprojectDisplayInput(f.standingLongJump, 'length', prev, unitSystem),
    }));
  }, [unitSystem]);

  /** Inputs or baseline (age/sex/height/weight) change → prior preview is no longer valid. */
  useEffect(() => {
    queueMicrotask(() => {
      setPreviewScore(null);
      setPreviewBreakdown(null);
      setCapNoticeInterpolation(null);
      setSubmitDone(false);
      setErrorKey(null);
    });
  }, [verticalJumpInput, standingLongJumpInput, sprintInput, profile, unitSystem]);

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
      ...metricScoringInputs,
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
  }, [metricScoringInputs, profile, profileReady, applySuccessfulExplosivePreview]);

  const persistToDashboard = useCallback((): boolean => {
    setSubmitDone(false);
    setErrorKey(null);
    const result = tryComputeExplosiveAssessmentScore({
      ...metricScoringInputs,
      profile,
      profileReady,
    });
    if (!result.ok) {
      setErrorKey(result.error);
      setPreviewScore(null);
      setPreviewBreakdown(null);
      setCapNoticeInterpolation(null);
      return false;
    }

    const prev = mergePersisted();
    savePowerInputs({
      ...prev,
      explosivePower: result.persisted,
    });
    setStoreScore('explosivePower', result.score);
    applySuccessfulExplosivePreview(result);
    setSubmitDone(true);
    queueStructuredProfileAfterRadarSubmit();
    return true;
  }, [
    applySuccessfulExplosivePreview,
    metricScoringInputs,
    profile,
    profileReady,
    setStoreScore,
  ]);

  const submitToRadar = useCallback(() => {
    if (!persistToDashboard()) return;
    navigateHomeWithResonance(navigate);
  }, [navigate, persistToDashboard]);

  return {
    profile,
    profileReady,
    verticalJumpInput,
    setVerticalJumpInput,
    standingLongJumpInput,
    setStandingLongJumpInput,
    sprintInput,
    setSprintInput,
    metricScoringInputs,
    previewScore,
    previewBreakdown,
    capNoticeInterpolation,
    powerNormAnchors,
    submitDone,
    errorKey,
    clearError,
    calculate,
    persistToDashboard,
    submitToRadar,
  };
}
