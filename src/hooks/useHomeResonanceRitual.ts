import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { exitIfRunCancelled } from '../lib/ritualRunGuard';
import { prefersReducedMotion } from '../lib/motionPreference';
import {
  consumePendingRadarResonance,
  hasPendingRadarResonance,
} from '../services/radarResonanceSession';
import { ROUTES } from '../config/routes';
import { useBootSequenceStore } from '../stores/bootSequenceStore';
import { useUiInteractionStore } from '../stores/uiInteractionStore';
import { resolveOverallGradeTierCopy } from '../i18n/resolveOverallGradeCopy';
import {
  formatOverallGradeRevealLine,
  resolveOverallGradeBand,
} from '../logic/core/scoreMeaningCatalog';
import type { VehicleClassId } from '../logic/core/vehicleResolver';
import type { RadarChartPoint } from '../types/radarDisplay';
import type { HomeResonancePhase, HomeResonanceSnapshot } from '../types/homeResonance';
import { useAnimatedScore } from './useAnimatedScore';
import { useDopamineFeedback } from './useDopamineFeedback';
import { useTypewriterText } from './useTypewriterText';

export type { HomeResonancePhase, HomeResonanceSnapshot };

const T_BOOT = 0;
const T_CHARGE = 500;
const T_COUNT = 1000;
const T_REVEAL = 1500;
const FILL_DURATION_MS = T_COUNT - T_CHARGE;

export interface UseHomeResonanceRitualInput {
  overallScore: number;
  radarPoints: RadarChartPoint[];
  vehicleClassId: VehicleClassId;
  genderGroup: string;
}

export interface UseHomeResonanceRitualResult {
  open: boolean;
  phase: HomeResonancePhase;
  ritualFill: number;
  displayScore: number | null;
  showBootScore: boolean;
  typedGradeLine: string;
  snapshot: HomeResonanceSnapshot | null;
  startRitual: () => Promise<void>;
  closeRitual: () => void;
}

function waitMs(
  ms: number,
  isActive: () => boolean,
  timeoutIdsRef: { current: number[] }
): Promise<void> {
  return new Promise((resolve) => {
    if (!isActive()) {
      resolve();
      return;
    }
    const id = window.setTimeout(() => {
      timeoutIdsRef.current = timeoutIdsRef.current.filter((tid) => tid !== id);
      resolve();
    }, ms);
    timeoutIdsRef.current.push(id);
  });
}

function animateRitualFill(
  setFill: (value: number) => void,
  durationMs: number,
  isActive: () => boolean,
  rafRef: { current: number | null }
): Promise<void> {
  if (!isActive()) return Promise.resolve();
  if (prefersReducedMotion()) {
    setFill(1);
    return Promise.resolve();
  }

  const startedAt = performance.now();
  return new Promise((resolve) => {
    const tick = (now: number) => {
      if (!isActive()) {
        rafRef.current = null;
        resolve();
        return;
      }
      const rawT = Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - (1 - rawT) ** 3;
      setFill(eased);
      if (rawT < 1) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      rafRef.current = null;
      resolve();
    };
    rafRef.current = requestAnimationFrame(tick);
  });
}

function acknowledgePendingResonanceIfNeeded(shouldConsumeRef: { current: boolean }): void {
  if (!shouldConsumeRef.current) return;
  shouldConsumeRef.current = false;
  consumePendingRadarResonance();
}

export function useHomeResonanceRitual({
  overallScore,
  radarPoints,
  vehicleClassId,
  genderGroup,
}: UseHomeResonanceRitualInput): UseHomeResonanceRitualResult {
  const { t } = useTranslation('common');
  const location = useLocation();
  const { triggerImpact } = useDopamineFeedback();
  const {
    displayValue,
    animateTo,
    cancel: cancelScoreAnim,
    setInstant,
  } = useAnimatedScore({
    durationMs: 480,
  });
  const {
    visibleText: typedGradeLine,
    play: playTypewriter,
    reset: resetTypewriter,
    cancel: cancelTypewriter,
  } = useTypewriterText();

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<HomeResonancePhase>('idle');
  const [ritualFill, setRitualFill] = useState(1);
  const [showBootScore, setShowBootScore] = useState(false);
  const [snapshot, setSnapshot] = useState<HomeResonanceSnapshot | null>(null);

  const runIdRef = useRef(0);
  const fillRafRef = useRef<number | null>(null);
  const timeoutIdsRef = useRef<number[]>([]);
  const phaseRef = useRef<HomeResonancePhase>('idle');
  const pendingAckRef = useRef(false);
  const bootCompleted = useBootSequenceStore((s) => s.completed);
  const setBlocking = useUiInteractionStore((s) => s.setHomeResonanceBlocking);

  phaseRef.current = phase;

  const invalidateRun = useCallback(() => {
    runIdRef.current += 1;
    for (const id of timeoutIdsRef.current) {
      window.clearTimeout(id);
    }
    timeoutIdsRef.current = [];
    if (fillRafRef.current !== null) {
      cancelAnimationFrame(fillRafRef.current);
      fillRafRef.current = null;
    }
  }, []);

  const buildSnapshot = useCallback((): HomeResonanceSnapshot => {
    const gradeBandId = resolveOverallGradeBand(overallScore);
    const { name: gradeName, desc: gradeDesc } = resolveOverallGradeTierCopy(t, gradeBandId);
    return {
      overallScore,
      radarPoints,
      gradeBandId,
      gradeLine: formatOverallGradeRevealLine(gradeName, gradeDesc),
      archetypeTitle: t(`identity.archetypes.${vehicleClassId}.title`),
      archetypeSummary: t(`identity.archetypes.${vehicleClassId}.summary`, { genderGroup }),
    };
  }, [genderGroup, overallScore, radarPoints, t, vehicleClassId]);

  const closeRitual = useCallback(() => {
    invalidateRun();
    cancelScoreAnim();
    cancelTypewriter();
    setOpen(false);
    setPhase('idle');
    setRitualFill(1);
    setShowBootScore(false);
    setSnapshot(null);
    resetTypewriter();
    setInstant(null);
    setBlocking(false);
    pendingAckRef.current = false;
  }, [cancelScoreAnim, cancelTypewriter, invalidateRun, resetTypewriter, setBlocking, setInstant]);

  const closeRitualRef = useRef(closeRitual);
  closeRitualRef.current = closeRitual;

  const startRitual = useCallback(async () => {
    invalidateRun();
    const runId = runIdRef.current;
    const isActive = () => runId === runIdRef.current;
    const exitIfCancelled = () => exitIfRunCancelled(runId, runIdRef, closeRitual);

    const nextSnapshot = buildSnapshot();
    setSnapshot(nextSnapshot);
    setOpen(true);
    setBlocking(true);
    setPhase('boot');
    setShowBootScore(true);
    setRitualFill(0);
    setInstant(null);
    resetTypewriter();

    const reduced = prefersReducedMotion();

    try {
      if (reduced) {
        if (exitIfCancelled()) return;
        triggerImpact('medium');
        setRitualFill(1);
        setShowBootScore(false);
        setPhase('count');
        await animateTo(nextSnapshot.overallScore, 0);
        if (exitIfCancelled()) return;
        setPhase('reveal');
        triggerImpact('heavy');
        await playTypewriter(nextSnapshot.gradeLine);
        if (exitIfCancelled()) return;
        setPhase('report');
        acknowledgePendingResonanceIfNeeded(pendingAckRef);
        return;
      }

      triggerImpact('light');

      await waitMs(T_CHARGE - T_BOOT, isActive, timeoutIdsRef);
      if (exitIfCancelled()) return;

      setPhase('charge');
      await animateRitualFill(setRitualFill, FILL_DURATION_MS, isActive, fillRafRef);
      if (exitIfCancelled()) return;

      triggerImpact('light');
      setPhase('count');
      setShowBootScore(false);
      triggerImpact('medium');
      await animateTo(nextSnapshot.overallScore, 0);
      if (exitIfCancelled()) return;

      await waitMs(T_REVEAL - T_COUNT, isActive, timeoutIdsRef);
      if (exitIfCancelled()) return;

      setPhase('reveal');
      triggerImpact('heavy');
      await playTypewriter(nextSnapshot.gradeLine);
      if (exitIfCancelled()) return;
      setPhase('report');
      acknowledgePendingResonanceIfNeeded(pendingAckRef);
    } catch {
      if (runIdRef.current === runId) {
        closeRitual();
      }
    }
  }, [
    animateTo,
    buildSnapshot,
    closeRitual,
    invalidateRun,
    playTypewriter,
    resetTypewriter,
    setBlocking,
    setInstant,
    triggerImpact,
  ]);

  const startRitualRef = useRef(startRitual);
  startRitualRef.current = startRitual;

  useEffect(() => {
    if (!bootCompleted) return;
    if (location.pathname !== ROUTES.home) return;
    if (!hasPendingRadarResonance()) return;
    pendingAckRef.current = true;
    void startRitualRef.current();
  }, [bootCompleted, location.pathname]);

  // WHY: Empty deps — tying cleanup to `closeRitual` identity re-ran teardown on every render
  // when upstream hooks return unstable cancel fns, closing the overlay mid-ritual.
  useEffect(() => () => closeRitualRef.current(), []);

  return {
    open,
    phase,
    ritualFill,
    displayScore: displayValue,
    showBootScore,
    typedGradeLine,
    snapshot,
    startRitual,
    closeRitual,
  };
}
