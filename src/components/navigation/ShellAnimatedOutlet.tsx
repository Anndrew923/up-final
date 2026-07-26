import { useLayoutEffect, useRef, useState, type FC } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { cn } from '../../lib/cn';
import {
  GLOBAL_TAB_ROUTE_DURATION_MS,
  GLOBAL_TAB_ROUTE_TRANSITION,
  TAB_ROUTE_INSTANT,
  globalTabRouteEnterVisible,
  globalTabRouteWillChange,
} from '../../lib/globalRouteMotion';
import { TAB_ROUTE_SHOW_PROGRESS_BAR } from '../../lib/tabRouteSensoryMotion';
import { usePrefersReducedMotion } from '../../lib/motionPreference';
import { resolveRouteTransitionKind, isTabRouteTransition } from '../../logic/core/routeTransitionKind';
import { useTabRouteTransitionStore } from '../../stores/tabRouteTransitionStore';

/**
 * AppShell route outlet — single-mount tab enter fade.
 * WHY: Dual-mount crossfade (exiting + entering) forced heavy pages to paint twice;
 * opacity-only enter on the new outlet keeps GPU cost and lag feel down.
 * Flip `TAB_ROUTE_INSTANT` for 0ms hard swap.
 */
const ShellAnimatedOutlet: FC = () => {
  const location = useLocation();
  const outlet = useOutlet();
  const reducedMotion = usePrefersReducedMotion();
  const startSprint = useTabRouteTransitionStore((state) => state.startSprint);
  const completeSettle = useTabRouteTransitionStore((state) => state.completeSettle);
  const finish = useTabRouteTransitionStore((state) => state.finish);
  const cancelTransition = useTabRouteTransitionStore((state) => state.cancel);
  const prevPathRef = useRef(location.pathname);
  const [entered, setEntered] = useState(true);
  const [compositorHint, setCompositorHint] = useState(false);

  useLayoutEffect(() => {
    const fromPath = prevPathRef.current;
    const toPath = location.pathname;
    const kind = resolveRouteTransitionKind(fromPath, toPath, reducedMotion, TAB_ROUTE_INSTANT);
    const tabSwitch = isTabRouteTransition(fromPath, toPath);

    if (!tabSwitch) {
      cancelTransition();
      setEntered(true);
      setCompositorHint(false);
      prevPathRef.current = toPath;
      return;
    }

    // Central clock — drives PDK Ack even when fade / progress visuals are off.
    startSprint();

    const fadeIn = kind === 'tab-fade-in';

    if (fadeIn) {
      setEntered(false);
      setCompositorHint(true);
    } else {
      setEntered(true);
      setCompositorHint(false);
    }

    prevPathRef.current = toPath;

    let cancelled = false;
    let raf = 0;
    if (fadeIn) {
      raf = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (!cancelled) setEntered(true);
        });
      });
    }

    // Instant / reduced-motion: settle immediately so haptic ack is not artificially delayed.
    const settleMs = fadeIn ? GLOBAL_TAB_ROUTE_DURATION_MS : 0;
    // Mutable bag so cleanup always sees the nested finish timer after settle fires.
    const timers = { settle: 0, finish: 0 };
    timers.settle = window.setTimeout(() => {
      completeSettle();
      if (fadeIn) setCompositorHint(false);
      // WHY: Progress bar normally calls finish(). Defer so settle paints for PDK Ack
      // (same-tick finish would batch away `phase: 'settle'` under React 18).
      if (!TAB_ROUTE_SHOW_PROGRESS_BAR) {
        timers.finish = window.setTimeout(() => finish(), 0);
      }
    }, settleMs);

    return () => {
      cancelled = true;
      if (fadeIn) window.cancelAnimationFrame(raf);
      window.clearTimeout(timers.settle);
      window.clearTimeout(timers.finish);
    };
  }, [
    cancelTransition,
    completeSettle,
    finish,
    location.pathname,
    reducedMotion,
    startSprint,
  ]);

  return (
    <div
      className={cn(
        'relative',
        compositorHint && GLOBAL_TAB_ROUTE_TRANSITION,
        compositorHint && globalTabRouteWillChange(compositorHint),
        compositorHint ? globalTabRouteEnterVisible(entered) : '',
      )}
    >
      {outlet}
    </div>
  );
};

export default ShellAnimatedOutlet;
