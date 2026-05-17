import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { prefersReducedMotion } from '../lib/motionPreference';
import { consumePendingRadarResonance } from '../services/radarResonanceSession';
import { useBootSequenceStore } from '../stores/bootSequenceStore';
import { useUiInteractionStore } from '../stores/uiInteractionStore';
import { resolveOverallGradeBand } from '../logic/core/scoreMeaningCatalog';
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
  vehicleClassId: string;
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
  timeoutIdsRef: { current: number[] },
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
  rafRef: { current: number | null },
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

export function useHomeResonanceRitual({
  overallScore,
  radarPoints,
  vehicleClassId,
}: UseHomeResonanceRitualInput): UseHomeResonanceRitualResult {
  const { t } = useTranslation('common');
  const { triggerImpact } = useDopamineFeedback();
  const { displayValue, animateTo, cancel: cancelScoreAnim, setInstant } = useAnimatedScore({
    durationMs: 480,
  });
  const { visibleText: typedGradeLine, play: playTypewriter, reset: resetTypewriter, cancel: cancelTypewriter } =
    useTypewriterText();

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<HomeResonancePhase>('idle');
  const [ritualFill, setRitualFill] = useState(1);
  const [showBootScore, setShowBootScore] = useState(false);
  const [snapshot, setSnapshot] = useState<HomeResonanceSnapshot | null>(null);

  const runIdRef = useRef(0);
  const fillRafRef = useRef<number | null>(null);
  const timeoutIdsRef = useRef<number[]>([]);
  const bootCompleted = useBootSequenceStore((s) => s.completed);
  const setBlocking = useUiInteractionStore((s) => s.setHomeResonanceBlocking);

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
    return {
      overallScore,
      radarPoints,
      gradeBandId,
      gradeLine: t(`home.overallGrade.${gradeBandId}`),
      archetypeTitle: t(`identity.archetypes.${vehicleClassId}.title`),
    };
  }, [overallScore, radarPoints, t, vehicleClassId]);

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
  }, [
    cancelScoreAnim,
    cancelTypewriter,
    invalidateRun,
    resetTypewriter,
    setBlocking,
    setInstant,
  ]);

  const startRitual = useCallback(async () => {
    invalidateRun();
    const runId = runIdRef.current;
    const isActive = () => runId === runIdRef.current;

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
        if (!isActive()) return;
        triggerImpact('medium');
        setRitualFill(1);
        setShowBootScore(false);
        setPhase('count');
        await animateTo(nextSnapshot.overallScore, 0);
        if (!isActive()) return;
        setPhase('reveal');
        triggerImpact('heavy');
        await playTypewriter(nextSnapshot.gradeLine);
        return;
      }

      triggerImpact('light');

      await waitMs(T_CHARGE - T_BOOT, isActive, timeoutIdsRef);
      if (!isActive()) return;

      setPhase('charge');
      await animateRitualFill(setRitualFill, FILL_DURATION_MS, isActive, fillRafRef);
      if (!isActive()) return;

      triggerImpact('light');
      setPhase('count');
      setShowBootScore(false);
      triggerImpact('medium');
      await animateTo(nextSnapshot.overallScore, 0);
      if (!isActive()) return;

      await waitMs(T_REVEAL - T_COUNT, isActive, timeoutIdsRef);
      if (!isActive()) return;

      setPhase('reveal');
      triggerImpact('heavy');
      await playTypewriter(nextSnapshot.gradeLine);
    } catch {
      if (isActive()) {
        invalidateRun();
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
    if (!consumePendingRadarResonance()) return;
    void startRitualRef.current();
  }, [bootCompleted]);

  useEffect(
    () => () => {
      invalidateRun();
      setBlocking(false);
    },
    [invalidateRun, setBlocking],
  );

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
