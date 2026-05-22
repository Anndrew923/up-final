import { useEffect, useState } from 'react';
import { DIAGNOSTICS_ENTRANCE_MS } from '../lib/diagnosticsReportMotion';
import { prefersReducedMotion } from '../lib/motionPreference';

export interface UseDiagnosticsReportEntranceResult {
  /** True after mount (rAF) or immediately when reduced-motion is preferred. */
  entered: boolean;
  /** False while entrance transitions run; used to drop `will-change` after completion. */
  motionActive: boolean;
}

/**
 * Triggers report panel entrance on the next frame so CSS transitions run reliably on iOS WebView.
 * WHY: Keyframes that animate opacity + backdrop-filter together left the panel stuck invisible.
 */
export function useDiagnosticsReportEntrance(): UseDiagnosticsReportEntranceResult {
  const [entered, setEntered] = useState(() => prefersReducedMotion());
  const [motionActive, setMotionActive] = useState(() => !prefersReducedMotion());

  useEffect(() => {
    if (prefersReducedMotion()) {
      setEntered(true);
      setMotionActive(false);
      return;
    }

    const frame = requestAnimationFrame(() => setEntered(true));
    const idleTimer = window.setTimeout(() => setMotionActive(false), DIAGNOSTICS_ENTRANCE_MS);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(idleTimer);
    };
  }, []);

  return { entered, motionActive };
}
