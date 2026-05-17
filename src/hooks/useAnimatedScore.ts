import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_DURATION_MS = 650;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export interface UseAnimatedScoreOptions {
  durationMs?: number;
}

export interface UseAnimatedScoreResult {
  displayValue: number | null;
  isAnimating: boolean;
  setInstant: (value: number | null) => void;
  animateTo: (target: number, from?: number | null) => Promise<void>;
  cancel: () => void;
}

/**
 * RAF count-up for assessment score reveals — transform-friendly, no layout thrash.
 */
export function useAnimatedScore(options: UseAnimatedScoreOptions = {}): UseAnimatedScoreResult {
  const durationMs = options.durationMs ?? DEFAULT_DURATION_MS;
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const frameRef = useRef<number | null>(null);
  const settleRef = useRef<(() => void) | null>(null);

  const cancel = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    settleRef.current?.();
    settleRef.current = null;
    setIsAnimating(false);
  }, []);

  useEffect(() => () => cancel(), [cancel]);

  const setInstant = useCallback((value: number | null) => {
    cancel();
    setDisplayValue(value);
  }, [cancel]);

  const animateTo = useCallback(
    (target: number, from?: number | null): Promise<void> => {
      cancel();
      const safeTarget = Number.isFinite(target) ? target : 0;
      const startValue = Number.isFinite(from ?? NaN) ? Number(from) : 0;

      if (prefersReducedMotion() || Math.abs(safeTarget - startValue) < 0.001) {
        setDisplayValue(safeTarget);
        return Promise.resolve();
      }

      setIsAnimating(true);
      setDisplayValue(startValue);
      const startedAt = performance.now();

      return new Promise<void>((resolve) => {
        settleRef.current = resolve;

        const tick = (now: number) => {
          const elapsed = now - startedAt;
          const rawT = Math.min(1, elapsed / durationMs);
          const eased = easeOutCubic(rawT);
          const next = startValue + (safeTarget - startValue) * eased;
          setDisplayValue(next);

          if (rawT < 1) {
            frameRef.current = requestAnimationFrame(tick);
            return;
          }

          setDisplayValue(safeTarget);
          setIsAnimating(false);
          frameRef.current = null;
          settleRef.current = null;
          resolve();
        };

        frameRef.current = requestAnimationFrame(tick);
      });
    },
    [cancel, durationMs]
  );

  return {
    displayValue,
    isAnimating,
    setInstant,
    animateTo,
    cancel,
  };
}
