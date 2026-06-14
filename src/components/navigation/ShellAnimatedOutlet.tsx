import { useLayoutEffect, useRef, useState, type FC, type ReactNode } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { cn } from '../../lib/cn';
import {
  GLOBAL_TAB_ROUTE_DURATION_MS,
  GLOBAL_TAB_ROUTE_TRANSITION,
  globalTabRouteEnterVisible,
  globalTabRouteExitVisible,
  globalTabRouteWillChange,
} from '../../lib/globalRouteMotion';
import { usePrefersReducedMotion } from '../../lib/motionPreference';
import { resolveRouteTransitionKind, isTabRouteTransition } from '../../logic/core/routeTransitionKind';
import { useTabRouteTransitionStore } from '../../stores/tabRouteTransitionStore';

/**
 * AppShell route outlet with bottom-tab crossfade (WHY: single gate — pages stay transition-free).
 */
const ShellAnimatedOutlet: FC = () => {
  const location = useLocation();
  const outlet = useOutlet();
  const reducedMotion = usePrefersReducedMotion();
  const startSprint = useTabRouteTransitionStore((state) => state.startSprint);
  const completeSettle = useTabRouteTransitionStore((state) => state.completeSettle);
  const cancelTransition = useTabRouteTransitionStore((state) => state.cancel);
  const prevPathRef = useRef(location.pathname);
  const prevOutletRef = useRef(outlet);
  const [exitingOutlet, setExitingOutlet] = useState<ReactNode | null>(null);
  const [entered, setEntered] = useState(true);
  const [compositorHint, setCompositorHint] = useState(false);

  useLayoutEffect(() => {
    const fromPath = prevPathRef.current;
    const toPath = location.pathname;
    const previousOutlet = prevOutletRef.current;
    const kind = resolveRouteTransitionKind(fromPath, toPath, reducedMotion);
    const tabSwitch = isTabRouteTransition(fromPath, toPath);

    if (!tabSwitch) {
      cancelTransition();
      setExitingOutlet(null);
      setEntered(true);
      setCompositorHint(false);
      prevPathRef.current = toPath;
      prevOutletRef.current = outlet;
      return;
    }

    // Central 150ms clock — drives PDK Ack even when Strategy A skips crossfade visuals.
    startSprint();

    const crossfade = kind === 'tab-crossfade';

    if (crossfade) {
      setExitingOutlet(previousOutlet);
      setEntered(false);
      setCompositorHint(true);
    } else {
      setExitingOutlet(null);
      setEntered(true);
      setCompositorHint(false);
    }

    prevPathRef.current = toPath;
    prevOutletRef.current = outlet;

    let cancelled = false;
    let raf = 0;
    if (crossfade) {
      raf = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (!cancelled) setEntered(true);
        });
      });
    }

    const timer = window.setTimeout(() => {
      completeSettle();
      if (crossfade) {
        setExitingOutlet(null);
        setCompositorHint(false);
      }
    }, GLOBAL_TAB_ROUTE_DURATION_MS);

    return () => {
      cancelled = true;
      if (crossfade) window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [
    cancelTransition,
    completeSettle,
    location.pathname,
    outlet,
    reducedMotion,
    startSprint,
  ]);

  return (
    <div className="relative">
      {exitingOutlet != null ? (
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 top-0 z-0',
            GLOBAL_TAB_ROUTE_TRANSITION,
            globalTabRouteWillChange(compositorHint),
            globalTabRouteExitVisible(entered),
          )}
          aria-hidden
        >
          {exitingOutlet}
        </div>
      ) : null}
      <div
        className={cn(
          'relative z-[1]',
          compositorHint && GLOBAL_TAB_ROUTE_TRANSITION,
          compositorHint && globalTabRouteWillChange(compositorHint),
          compositorHint ? globalTabRouteEnterVisible(entered) : '',
        )}
      >
        {outlet}
      </div>
    </div>
  );
};

export default ShellAnimatedOutlet;
