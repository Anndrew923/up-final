import { useCallback, useEffect, useRef, useState } from 'react';
import { CERT_REVEAL_MS, type CertRevealPhase } from '../lib/certRevealMotion';
import { prefersReducedMotion } from '../lib/motionPreference';

export interface UseAestheticCertRevealResult {
  phase: CertRevealPhase;
  skip: () => void;
}

/**
 * 850ms certificate cascade clock.
 * WHY: Same one-shot timeout + reduced-motion short-circuit as diagnostics entrance.
 * Resting UI is always the finished stamp; this only toggles data-cert-phase for CSS.
 */
export function useAestheticCertReveal(): UseAestheticCertRevealResult {
  const [phase, setPhase] = useState<CertRevealPhase>(() =>
    prefersReducedMotion() ? 'done' : 'revealing'
  );
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const skip = useCallback(() => {
    clearTimer();
    setPhase('done');
  }, [clearTimer]);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setPhase('done');
      return;
    }

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setPhase('done');
    }, CERT_REVEAL_MS);

    return clearTimer;
  }, [clearTimer]);

  return { phase, skip };
}
