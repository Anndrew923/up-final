/**
 * ResizeObserver-driven uniform scale for the fixed logical certificate plate.
 * WHY: Keeps AestheticSpecCard presentational math out of JSX event handlers while
 * guaranteeing the plate is never flex-squashed below its design coordinates.
 */
import { useLayoutEffect, useState, type RefObject } from 'react';
import { resolveCertPlateFitScale } from '../logic/aesthetic/certPlateFitScale';

export function useCertPlateFitScale(
  viewportRef: RefObject<HTMLElement | null>,
  plateWidth: number,
  plateHeight: number
): number {
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    const measure = () => {
      const rect = node.getBoundingClientRect();
      const next = resolveCertPlateFitScale(rect.width, rect.height, plateWidth, plateHeight);
      // WHY: ResizeObserver can fire with identical boxes — skip setState to avoid plate flicker.
      setScale((prev) => (prev === next ? prev : next));
    };

    measure();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }

    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, [viewportRef, plateWidth, plateHeight]);

  return scale;
}
