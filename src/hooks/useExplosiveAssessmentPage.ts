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
  resolveExplosivePowerScoreForDisplay,
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
import type { ExplosivePowerRawPersisted, PowerInputsPersisted } from '../types/powerInputs';
import { useScoreStore } from '../stores/scoreStore';
import { useUnitPreferenceStore } from '../stores/unitPreferenceStore';

export type { ExplosiveCapNoticeInterpolation };
export type { ExplosivePowerNormAnchors };

export type ExplosiveAssessmentTab = 'jumps' | 'sprint';

export type ExplosivePageErrorKey = ExplosiveAssessmentComputeError | null;

export interface UseExplosiveAssessmentPageResult {
  profile: PhysicalProfile | null;
  profileReady: boolean;
  activeTab: ExplosiveAssessmentTab;
  setActiveTab: (tab: ExplosiveAssessmentTab) => void;
  verticalJumpInput: string;
  setVerticalJumpInput: (v: string) => void;
  standingLongJumpInput: string;
  setStandingLongJumpInput: (v: string) => void;
  sprintInput: string;
  setSprintInput: (v: string) => void;
  /**
   * Tab-scoped metric strings for scoring + ladder (inactive tab fields blanked).
   * WHY: Mirror cardio — sync bar uploads only the active specialty/core surface.
   */
  metricScoringInputs: {
    verticalJumpInput: string;
    standingLongJumpInput: string;
    sprintInput: string;
  };
  previewScore: number | null;
  previewBreakdown: ExplosivePowerBreakdown | null;
  capNoticeInterpolation: ExplosiveCapNoticeInterpolation | null;
  powerNormAnchors: ExplosivePowerNormAnchors | null;
  submitDone: boolean;
  errorKey: ExplosivePageErrorKey;
  clearError: () => void;
  calculate: () => void;
  persistToDashboard: () => boolean;
  /**
   * Persist active tab (jumps → radar axis + home resonance; sprint → specialty only).
   * WHY: Name reflects tab-scoped submit, not “always write radar”.
   */
  submitAssessment: () => void;
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

function mergeExplosiveBlockForTab(
  prev: ExplosivePowerRawPersisted | undefined,
  tab: ExplosiveAssessmentTab,
  persisted: ExplosivePowerRawPersisted
): ExplosivePowerRawPersisted {
  const next: ExplosivePowerRawPersisted = { ...(prev ?? {}) };
  if (tab === 'jumps') {
    if (persisted.verticalJumpCm != null) next.verticalJumpCm = persisted.verticalJumpCm;
    else delete next.verticalJumpCm;
    if (persisted.standingLongJumpCm != null) next.standingLongJumpCm = persisted.standingLongJumpCm;
    else delete next.standingLongJumpCm;
  } else {
    if (persisted.sprintSeconds != null) next.sprintSeconds = persisted.sprintSeconds;
    else delete next.sprintSeconds;
  }
  return next;
}

export function useExplosiveAssessmentPage(): UseExplosiveAssessmentPageResult {
  const navigate = useNavigate();
  const setStoreScore = useScoreStore((s) => s.setScore);
  const unitSystem = useUnitPreferenceStore((s) => s.unitSystem);
  const prevUnitSystemRef = useRef(unitSystem);
  const [profile, setProfile] = useState(loadPhysicalProfile);
  const [activeTab, setActiveTabState] = useState<ExplosiveAssessmentTab>('jumps');
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
  const lastPersistWroteRadarAxisRef = useRef(false);

  const profileReady = isPhysicalProfileComplete(profile);

  const metricScoringInputs = useMemo(() => {
    const vj = toMetricLengthField(verticalJumpInput, unitSystem);
    const slj = toMetricLengthField(standingLongJumpInput, unitSystem);
    if (activeTab === 'jumps') {
      return { verticalJumpInput: vj, standingLongJumpInput: slj, sprintInput: '' };
    }
    return { verticalJumpInput: '', standingLongJumpInput: '', sprintInput };
  }, [activeTab, sprintInput, standingLongJumpInput, unitSystem, verticalJumpInput]);

  const powerNormAnchors = useMemo((): ExplosivePowerNormAnchors | null => {
    if (!profileReady || !profile) return null;
    return getPowerStandardsForProfile(profile);
  }, [profile, profileReady]);

  const setActiveTab = useCallback((tab: ExplosiveAssessmentTab) => {
    setActiveTabState(tab);
    setPreviewScore(null);
    setPreviewBreakdown(null);
    setCapNoticeInterpolation(null);
    setSubmitDone(false);
    setErrorKey(null);
  }, []);

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

  useEffect(() => {
    queueMicrotask(() => {
      setPreviewScore(null);
      setPreviewBreakdown(null);
      setCapNoticeInterpolation(null);
      setSubmitDone(false);
      setErrorKey(null);
    });
  }, [verticalJumpInput, standingLongJumpInput, sprintInput, profile, unitSystem, activeTab]);

  useEffect(() => {
    const sync = () => setProfile(loadPhysicalProfile());
    return subscribePhysicalProfile(sync);
  }, []);

  const clearError = useCallback(() => setErrorKey(null), []);

  const applySuccessfulExplosivePreview = useCallback(
    (result: {
      score: number | null;
      writesRadarAxis: boolean;
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
    const nextBlock = mergeExplosiveBlockForTab(prev.explosivePower, activeTab, result.persisted);
    savePowerInputs({
      ...prev,
      explosivePower: nextBlock,
    });

    if (activeTab === 'jumps' && result.writesRadarAxis && result.score != null) {
      setStoreScore('explosivePower', result.score);
      lastPersistWroteRadarAxisRef.current = true;
    } else {
      // Specialty tab (or jumps with no axis): keep jump-derived axis if present, else clear.
      const axis = resolveExplosivePowerScoreForDisplay(profile, { explosivePower: nextBlock });
      setStoreScore('explosivePower', axis ?? 0);
      lastPersistWroteRadarAxisRef.current = activeTab === 'jumps' && axis != null;
    }
    applySuccessfulExplosivePreview(result);
    setSubmitDone(true);
    queueStructuredProfileAfterRadarSubmit();
    return true;
  }, [
    activeTab,
    applySuccessfulExplosivePreview,
    metricScoringInputs,
    profile,
    profileReady,
    setStoreScore,
  ]);

  const submitAssessment = useCallback(() => {
    if (!persistToDashboard()) return;
    if (!lastPersistWroteRadarAxisRef.current) return;
    navigateHomeWithResonance(navigate);
  }, [navigate, persistToDashboard]);

  return {
    profile,
    profileReady,
    activeTab,
    setActiveTab,
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
    submitAssessment,
  };
}
