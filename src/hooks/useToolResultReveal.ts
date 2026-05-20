import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnimatedScore } from './useAnimatedScore';
import { useDopamineFeedback } from './useDopamineFeedback';

const COUNT_UP_MS = 650;
const MODAL_SETTLE_MS = 200;

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export interface UseToolResultRevealOptions {
  haptic: 'medium' | 'heavy';
}

export interface UseToolResultRevealResult {
  displayValue: number | null;
  isBlocking: boolean;
  modalOpen: boolean;
  reveal: (target: number, canRun: boolean) => Promise<boolean>;
  closeModal: () => void;
}

/**
 * Tool calculator dopamine timeline: count-up → settle → modal + haptic.
 * WHY: Keeps page hooks math-only; ceremony timing lives in one reusable facade.
 */
export function useToolResultReveal({
  haptic,
}: UseToolResultRevealOptions): UseToolResultRevealResult {
  const { triggerImpact } = useDopamineFeedback();
  const { displayValue, animateTo, cancel } = useAnimatedScore({ durationMs: COUNT_UP_MS });
  const [modalOpen, setModalOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const busyRef = useRef(false);
  const displayValueRef = useRef(displayValue);

  useEffect(() => {
    displayValueRef.current = displayValue;
  }, [displayValue]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setIsBlocking(false);
    busyRef.current = false;
    cancel();
  }, [cancel]);

  const reveal = useCallback(
    async (target: number, canRun: boolean): Promise<boolean> => {
      if (!canRun || busyRef.current) return false;

      busyRef.current = true;
      setIsBlocking(true);
      setModalOpen(false);

      try {
        const safeTarget = Number.isFinite(target) ? target : 0;
        await animateTo(safeTarget, displayValueRef.current ?? 0);
        await waitMs(MODAL_SETTLE_MS);
        setModalOpen(true);
        triggerImpact(haptic);
        return true;
      } catch {
        setIsBlocking(false);
        busyRef.current = false;
        cancel();
        return false;
      }
    },
    [animateTo, cancel, haptic, triggerImpact]
  );

  return {
    displayValue,
    isBlocking,
    modalOpen,
    reveal,
    closeModal,
  };
}
