import { useEffect, useRef, useState } from 'react';
import type { ConsoleAxisViewMode } from '../logic/core/consoleAxisViewMode';
import {
  CONSOLE_S_MODE_CHARGE_SOFT_MS,
  CONSOLE_S_MODE_RITUAL_MS,
} from '../logic/core/consoleSModeRitual';
import { hapticService } from '../services/hapticService';
import {
  loadConsoleAxisViewMode,
  saveConsoleAxisViewMode,
  subscribeConsoleAxisViewMode,
} from '../services/localStorageService';

/**
 * Console fitness/telemetry view mode (WHY): Persistence + S-Mode sensory side effects
 * stay in the hooks layer so `HomeRadarBoard` remains presentational about lexicon paint.
 * Audio stays out — assessment charge_up is gated by tactical silence; haptics only here.
 */
export function useConsoleAxisViewMode(): {
  viewMode: ConsoleAxisViewMode;
  isSurging: boolean;
  setViewMode: (mode: ConsoleAxisViewMode) => void;
} {
  const [viewMode, setViewModeState] = useState<ConsoleAxisViewMode>(() =>
    loadConsoleAxisViewMode()
  );
  const [isSurging, setIsSurging] = useState(false);
  const surgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heavyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const surgeRafRef = useRef<number | null>(null);

  useEffect(() => {
    const sync = () => setViewModeState(loadConsoleAxisViewMode());
    return subscribeConsoleAxisViewMode(sync);
  }, []);

  useEffect(() => {
    return () => {
      if (surgeTimerRef.current !== null) clearTimeout(surgeTimerRef.current);
      if (heavyTimerRef.current !== null) clearTimeout(heavyTimerRef.current);
      if (surgeRafRef.current !== null) cancelAnimationFrame(surgeRafRef.current);
      // WHY: Avoid leaking continuous soft selection haptics across unmount / route leave.
      hapticService.stopContinuousSoft();
    };
  }, []);

  const clearPendingHaptics = () => {
    if (heavyTimerRef.current !== null) {
      clearTimeout(heavyTimerRef.current);
      heavyTimerRef.current = null;
    }
    hapticService.stopContinuousSoft();
  };

  const fireModeHaptics = (next: ConsoleAxisViewMode) => {
    clearPendingHaptics();
    if (next === 'telemetry') {
      // WHY: Assessment-parity charge then Heavy bite — soft micro-pulse, then gear-lock climax.
      hapticService.triggerContinuousSoft(CONSOLE_S_MODE_CHARGE_SOFT_MS);
      heavyTimerRef.current = setTimeout(() => {
        heavyTimerRef.current = null;
        void hapticService.trigger('climax');
      }, CONSOLE_S_MODE_CHARGE_SOFT_MS);
      return;
    }
    // WHY: Clean Medium click confirm when dropping out of S Mode (Light/Medium band).
    void hapticService.trigger('milestone');
  };

  const armVisualRitual = () => {
    // WHY: Drop then re-apply on next frame so rapid toggles re-trigger CSS keyframes.
    setIsSurging(false);
    if (surgeTimerRef.current !== null) clearTimeout(surgeTimerRef.current);
    if (surgeRafRef.current !== null) cancelAnimationFrame(surgeRafRef.current);
    surgeRafRef.current = requestAnimationFrame(() => {
      surgeRafRef.current = null;
      setIsSurging(true);
      surgeTimerRef.current = setTimeout(() => {
        setIsSurging(false);
        surgeTimerRef.current = null;
      }, CONSOLE_S_MODE_RITUAL_MS);
    });
  };

  const setViewMode = (next: ConsoleAxisViewMode) => {
    if (next === viewMode) return;
    setViewModeState(next);
    saveConsoleAxisViewMode(next);
    fireModeHaptics(next);
    armVisualRitual();
  };

  return { viewMode, isSurging, setViewMode };
}
