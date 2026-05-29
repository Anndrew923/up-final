import { useEffect, useState } from 'react';

/** Shared reduced-motion probe for ceremony / score / resonance timelines. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Reactive reduced-motion preference — WHY: render-time `prefersReducedMotion()` ignores
 * system setting changes until remount; Join Arena micro-interactions need live updates.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => prefersReducedMotion());

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return reduced;
}
