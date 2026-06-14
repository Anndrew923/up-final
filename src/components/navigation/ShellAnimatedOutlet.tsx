import { useLayoutEffect, useRef, useState, type FC, type ReactNode } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { cn } from '../../lib/cn';
import {
  GLOBAL_TAB_ROUTE_DURATION_MS,
  GLOBAL_TAB_ROUTE_REDUCED_DURATION_MS,
  GLOBAL_TAB_ROUTE_REDUCED_TRANSITION,
  GLOBAL_TAB_ROUTE_TRANSITION,
  globalTabRouteEnterVisible,
  globalTabRouteExitVisible,
  globalTabRouteReducedVisible,
  globalTabRouteWillChange,
} from '../../lib/globalRouteMotion';
import { usePrefersReducedMotion } from '../../lib/motionPreference';
import {
  resolveRouteTransitionKind,
  resolveTabSlideDirection,
  type RouteTransitionKind,
  type TabSlideDirection,
} from '../../logic/core/routeTransitionKind';

interface ExitingLayer {
  outlet: ReactNode;
  direction: TabSlideDirection;
  kind: Exclude<RouteTransitionKind, 'none'>;
}

/**
 * AppShell route outlet with bottom-tab parallax (WHY: single gate — pages stay transition-free).
 */
const ShellAnimatedOutlet: FC = () => {
  const location = useLocation();
  const outlet = useOutlet();
  const reducedMotion = usePrefersReducedMotion();
  const prevPathRef = useRef(location.pathname);
  const prevOutletRef = useRef(outlet);
  const [exiting, setExiting] = useState<ExitingLayer | null>(null);
  const [entered, setEntered] = useState(true);
  const [compositorHint, setCompositorHint] = useState(false);

  useLayoutEffect(() => {
    const fromPath = prevPathRef.current;
    const toPath = location.pathname;
    const previousOutlet = prevOutletRef.current;
    const kind = resolveRouteTransitionKind(fromPath, toPath, reducedMotion);

    if (kind === 'none') {
      setExiting(null);
      setEntered(true);
      setCompositorHint(false);
      prevPathRef.current = toPath;
      prevOutletRef.current = outlet;
      return;
    }

    const direction = resolveTabSlideDirection(fromPath, toPath);
    const durationMs =
      kind === 'reduced-tab-fade'
        ? GLOBAL_TAB_ROUTE_REDUCED_DURATION_MS
        : GLOBAL_TAB_ROUTE_DURATION_MS;

    if (kind === 'tab-parallax') {
      setExiting({
        outlet: previousOutlet,
        direction,
        kind,
      });
    } else {
      setExiting(null);
    }

    setEntered(false);
    setCompositorHint(true);

    prevPathRef.current = toPath;
    prevOutletRef.current = outlet;

    let cancelled = false;
    const raf = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (!cancelled) setEntered(true);
      });
    });

    const timer = window.setTimeout(() => {
      setExiting(null);
      setCompositorHint(false);
    }, durationMs);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [location.pathname, outlet, reducedMotion]);

  const transitionClass = reducedMotion
    ? GLOBAL_TAB_ROUTE_REDUCED_TRANSITION
    : GLOBAL_TAB_ROUTE_TRANSITION;
  const slideDirection =
    exiting?.direction ?? resolveTabSlideDirection(prevPathRef.current, location.pathname);

  return (
    <div className="relative">
      {exiting?.kind === 'tab-parallax' ? (
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 top-0 z-0',
            GLOBAL_TAB_ROUTE_TRANSITION,
            globalTabRouteWillChange(compositorHint),
            globalTabRouteExitVisible(entered, exiting.direction),
          )}
          aria-hidden
        >
          {exiting.outlet}
        </div>
      ) : null}
      <div
        className={cn(
          'relative z-[1]',
          compositorHint && transitionClass,
          compositorHint && globalTabRouteWillChange(compositorHint),
          exiting?.kind === 'tab-parallax'
            ? globalTabRouteEnterVisible(entered, slideDirection)
            : compositorHint && reducedMotion
              ? globalTabRouteReducedVisible(entered)
              : '',
        )}
      >
        {outlet}
      </div>
    </div>
  );
};

export default ShellAnimatedOutlet;
