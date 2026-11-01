import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { claimRadarArrivalDelivery } from '../services/radarResonanceSession';
import { useBootSequenceStore } from '../stores/bootSequenceStore';

/**
 * Turns a dyno-sync pending flag into a one-shot console arrival token.
 * WHY: Keep overlay `useHomeResonanceRitual` free of sync-handoff so manual diagnostics
 * cannot be coupled to auto-opening the blocking readout.
 *
 * @returns Generation token; 0 = idle. Increments each time a delivery is claimed.
 */
export function useConsoleArrivalPulse(): number {
  const location = useLocation();
  const bootCompleted = useBootSequenceStore((s) => s.completed);
  const [arrivalPulse, setArrivalPulse] = useState(0);

  useEffect(() => {
    if (!bootCompleted) return;
    if (location.pathname !== ROUTES.home) return;
    if (!claimRadarArrivalDelivery()) return;
    setArrivalPulse((n) => n + 1);
  }, [bootCompleted, location.pathname]);

  return arrivalPulse;
}
