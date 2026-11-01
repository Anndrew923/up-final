import { prefersReducedMotion } from './motionPreference';

/**
 * Presentation-only 0→1 radar radius tween.
 * WHY: Overlay charge and console arrival share the same easing; one helper prevents
 * duration / cancel-token drift between the two surfaces.
 */
export function tweenRadarFill(
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
      setFill(1);
      resolve();
    };
    rafRef.current = requestAnimationFrame(tick);
  });
}
