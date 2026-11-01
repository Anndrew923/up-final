import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../lib/motionPreference';
import { tweenRadarFill } from '../lib/radarFillTween';
import { settleRadarArrivalDelivery } from '../services/radarResonanceSession';
import { useAnimatedScore } from './useAnimatedScore';

export const CONSOLE_SYNC_ARRIVAL_FILL_MS = 600;
export const CONSOLE_SYNC_ARRIVAL_TOAST_HOLD_MS = 1800;
export const CONSOLE_SYNC_ARRIVAL_TOAST_FADE_MS = 280;

export interface UseConsoleSyncArrivalInput {
  overallScore: number;
  /** Generation token from `useConsoleArrivalPulse`; 0 = idle. */
  arrivalPulse: number;
  /**
   * Remount key for the live radar (e.g. fitness/telemetry view).
   * WHY: Arrival must suppress stroke-draw on the current instance, then release it
   * when the chart remounts so lexicon switches keep their entry animation.
   */
  radarInstanceKey: string;
}

export interface UseConsoleSyncArrivalResult {
  radarFill: number;
  suppressRadarEntryAnimation: boolean;
  displayScore: number;
  toastVisible: boolean;
  toastFading: boolean;
}

/**
 * Lightweight console handoff after dyno sync — radar expand, score ticker, non-blocking toast.
 * WHY: Keep motion out of `HomeRadarBoard` so the board stays presentational.
 */
export function useConsoleSyncArrival({
  overallScore,
  arrivalPulse,
  radarInstanceKey,
}: UseConsoleSyncArrivalInput): UseConsoleSyncArrivalResult {
  const {
    displayValue,
    isAnimating,
    animateTo,
    cancel: cancelScoreAnim,
    setInstant,
  } = useAnimatedScore({ durationMs: CONSOLE_SYNC_ARRIVAL_FILL_MS });

  const [radarFill, setRadarFill] = useState(1);
  const [suppressRadarEntryAnimation, setSuppressRadarEntryAnimation] = useState(false);
  const [toastPhase, setToastPhase] = useState<'hidden' | 'shown' | 'fading'>('hidden');

  const fillRafRef = useRef<number | null>(null);
  const timeoutIdsRef = useRef<number[]>([]);
  const runIdRef = useRef(0);
  const lastPulseRef = useRef(0);
  const scoreRef = useRef(overallScore);
  const cancelScoreAnimRef = useRef(cancelScoreAnim);
  const animateToRef = useRef(animateTo);
  const setInstantRef = useRef(setInstant);
  scoreRef.current = overallScore;
  cancelScoreAnimRef.current = cancelScoreAnim;
  animateToRef.current = animateTo;
  setInstantRef.current = setInstant;

  const stopMotionRef = useRef(() => {
    if (fillRafRef.current !== null) {
      cancelAnimationFrame(fillRafRef.current);
      fillRafRef.current = null;
    }
    for (const id of timeoutIdsRef.current) {
      window.clearTimeout(id);
    }
    timeoutIdsRef.current = [];
  });

  useEffect(() => {
    return () => {
      runIdRef.current += 1;
      stopMotionRef.current();
      cancelScoreAnimRef.current();
    };
  }, []);

  useEffect(() => {
    // Release stroke-draw suppression when the radar remounts (lexicon switch).
    setSuppressRadarEntryAnimation(false);
  }, [radarInstanceKey]);

  useEffect(() => {
    if (!Number.isFinite(arrivalPulse) || arrivalPulse <= 0) return;
    if (arrivalPulse === lastPulseRef.current) return;
    lastPulseRef.current = arrivalPulse;

    runIdRef.current += 1;
    const runId = runIdRef.current;
    const isActive = () => runId === runIdRef.current;
    stopMotionRef.current();

    const targetScore = scoreRef.current;
    setSuppressRadarEntryAnimation(true);
    setToastPhase('shown');

    const reduced = prefersReducedMotion();
    if (reduced) {
      setRadarFill(1);
      setInstantRef.current(targetScore);
    } else {
      setRadarFill(0);
      void tweenRadarFill(setRadarFill, CONSOLE_SYNC_ARRIVAL_FILL_MS, isActive, fillRafRef);
      void animateToRef.current(targetScore, 0);
    }

    const fadeId = window.setTimeout(() => {
      if (!isActive()) return;
      setToastPhase('fading');
    }, CONSOLE_SYNC_ARRIVAL_TOAST_HOLD_MS);
    const hideId = window.setTimeout(() => {
      if (!isActive()) return;
      setToastPhase('hidden');
      settleRadarArrivalDelivery();
    }, CONSOLE_SYNC_ARRIVAL_TOAST_HOLD_MS + CONSOLE_SYNC_ARRIVAL_TOAST_FADE_MS);
    timeoutIdsRef.current.push(fadeId, hideId);
  }, [arrivalPulse]);

  // WHY: After the ticker settles, follow live radar score so later local edits are not frozen.
  const displayScore =
    toastPhase !== 'hidden' || isAnimating ? (displayValue ?? overallScore) : overallScore;

  return {
    radarFill,
    suppressRadarEntryAnimation,
    displayScore,
    toastVisible: toastPhase !== 'hidden',
    toastFading: toastPhase === 'fading',
  };
}
