import { useLayoutEffect, useRef, useState, type FC } from 'react';
import { cn } from '../../lib/cn';
import {
  TAB_ROUTE_PROGRESS_FADE_MS,
  TAB_ROUTE_PROGRESS_SETTLE_MS,
  TAB_ROUTE_PROGRESS_SPRINT_SCALE,
  TAB_ROUTE_PROGRESS_TOP,
  TAB_ROUTE_PROGRESS_TRANSITION,
} from '../../lib/tabRouteSensoryMotion';
import { usePrefersReducedMotion } from '../../lib/motionPreference';
import { useTabRouteTransitionStore } from '../../stores/tabRouteTransitionStore';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';

/**
 * GPU-only tab switch progress strip — driven by central tab transition clock.
 */
const TopProgressBar: FC = () => {
  const reducedMotion = usePrefersReducedMotion();
  const phase = useTabRouteTransitionStore((state) => state.phase);
  const generation = useTabRouteTransitionStore((state) => state.generation);
  const finish = useTabRouteTransitionStore((state) => state.finish);
  const [scaleX, setScaleX] = useState(0);
  const [opacity, setOpacity] = useState(0);
  const [compositorHint, setCompositorHint] = useState(false);
  const activeGenerationRef = useRef(0);

  useLayoutEffect(() => {
    if (reducedMotion || phase === 'idle') {
      setScaleX(0);
      setOpacity(0);
      setCompositorHint(false);
      return;
    }

    activeGenerationRef.current = generation;
    setCompositorHint(true);

    if (phase === 'sprint') {
      setScaleX(0);
      setOpacity(1);
      const raf = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (activeGenerationRef.current !== generation) return;
          setScaleX(TAB_ROUTE_PROGRESS_SPRINT_SCALE);
        });
      });
      return () => window.cancelAnimationFrame(raf);
    }

    if (phase === 'settle') {
      setScaleX(TAB_ROUTE_PROGRESS_SPRINT_SCALE);
      setOpacity(1);
      const raf = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (activeGenerationRef.current !== generation) return;
          setScaleX(1);
        });
      });
      const settleTimer = window.setTimeout(() => {
        if (activeGenerationRef.current !== generation) return;
        setOpacity(0);
      }, TAB_ROUTE_PROGRESS_SETTLE_MS);

      const finishTimer = window.setTimeout(() => {
        if (activeGenerationRef.current !== generation) return;
        setScaleX(0);
        setCompositorHint(false);
        finish();
      }, TAB_ROUTE_PROGRESS_SETTLE_MS + TAB_ROUTE_PROGRESS_FADE_MS);

      return () => {
        window.cancelAnimationFrame(raf);
        window.clearTimeout(settleTimer);
        window.clearTimeout(finishTimer);
      };
    }

    return undefined;
  }, [finish, generation, phase, reducedMotion]);

  if (reducedMotion || phase === 'idle') return null;

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 h-[2px]',
        TAB_ROUTE_PROGRESS_TOP,
        Z_INDEX_CLASS.topProgressBar,
      )}
      aria-hidden
    >
      <div
        className={cn(
          'h-full w-full origin-left bg-[#DFFF00]',
          TAB_ROUTE_PROGRESS_TRANSITION,
          compositorHint ? 'will-change-[transform,opacity]' : '',
          phase === 'sprint' ? 'duration-[90ms]' : 'duration-[120ms]',
        )}
        style={{ transform: `scaleX(${scaleX})`, opacity }}
      />
    </div>
  );
};

export default TopProgressBar;
