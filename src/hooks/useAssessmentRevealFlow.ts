import { useCallback, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  buildPerformanceBreakthroughPayload,
  type PerformanceBreakthroughPayload,
} from '../logic/core/performanceBreakthrough';
import type { BreakthroughMetric } from '../logic/core/performanceBreakthrough';
import { useAnimatedScore } from './useAnimatedScore';
import {
  useAssessmentCeremony,
  type CeremonyPool,
  type UseAssessmentCeremonyResult,
} from './useAssessmentCeremony';
import { useDopamineFeedback } from './useDopamineFeedback';

const MODAL_SETTLE_MS = 200;

export type RevealFlowPhase = 'idle' | 'scanning' | 'revealing' | 'modal';

export interface UseAssessmentRevealFlowOptions {
  pool: CeremonyPool;
  metric: BreakthroughMetric;
  scoreDecimals: number;
  getScore: () => number | null;
  hasError: () => boolean;
  compute: () => void;
}

export interface UseAssessmentRevealFlowResult {
  ceremony: UseAssessmentCeremonyResult;
  phase: RevealFlowPhase;
  isBlocking: boolean;
  displayScore: number | null;
  revealCalculate: () => Promise<void>;
  modalOpen: boolean;
  modalPayload: PerformanceBreakthroughPayload | null;
  closeModal: () => void;
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function waitForPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

/**
 * Page-level facade: scan ceremony → count-up → breakthrough modal (dopamine timeline).
 */
export function useAssessmentRevealFlow({
  pool,
  metric,
  scoreDecimals,
  getScore,
  hasError,
  compute,
}: UseAssessmentRevealFlowOptions): UseAssessmentRevealFlowResult {
  const { t } = useTranslation('common');
  const { triggerImpact, triggerBreakthroughCelebration } = useDopamineFeedback();
  const ceremony = useAssessmentCeremony({ pool });
  const { displayValue, animateTo, cancel: cancelAnimation } = useAnimatedScore();

  const [phase, setPhase] = useState<RevealFlowPhase>('idle');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPayload, setModalPayload] = useState<PerformanceBreakthroughPayload | null>(null);
  const busyRef = useRef(false);
  const getScoreRef = useRef(getScore);
  const hasErrorRef = useRef(hasError);
  getScoreRef.current = getScore;
  hasErrorRef.current = hasError;

  const isBlocking = phase !== 'idle' || ceremony.isActive || busyRef.current;

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalPayload(null);
    setPhase('idle');
    busyRef.current = false;
  }, []);

  const revealCalculate = useCallback(async () => {
    if (busyRef.current || ceremony.isActive) return;

    busyRef.current = true;
    setPhase('scanning');
    setModalOpen(false);
    setModalPayload(null);

    const scoreBefore = getScoreRef.current();

    try {
      await ceremony.wrapCalculate(() => {
        flushSync(() => {
          compute();
        });
      });

      await waitForPaint();

      if (hasErrorRef.current()) {
        setPhase('idle');
        busyRef.current = false;
        cancelAnimation();
        return;
      }

      const scoreAfter = getScoreRef.current();
      if (scoreAfter === null || !Number.isFinite(scoreAfter)) {
        setPhase('idle');
        busyRef.current = false;
        cancelAnimation();
        return;
      }

      setPhase('revealing');
      triggerImpact('medium');
      await animateTo(scoreAfter, scoreBefore);
      await waitMs(MODAL_SETTLE_MS);

      const payload = buildPerformanceBreakthroughPayload(t, metric, scoreAfter, scoreDecimals);
      if (!payload) {
        setPhase('idle');
        busyRef.current = false;
        return;
      }

      setModalPayload(payload);
      setModalOpen(true);
      setPhase('modal');
      triggerBreakthroughCelebration();
    } catch {
      setPhase('idle');
      busyRef.current = false;
      cancelAnimation();
      ceremony.cancel();
    }
  }, [
    animateTo,
    cancelAnimation,
    ceremony,
    compute,
    metric,
    scoreDecimals,
    t,
    triggerImpact,
    triggerBreakthroughCelebration,
  ]);

  return {
    ceremony,
    phase,
    isBlocking,
    displayScore: displayValue,
    revealCalculate,
    modalOpen,
    modalPayload,
    closeModal,
  };
}
