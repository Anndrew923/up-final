import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePrefersReducedMotion } from '../lib/motionPreference';

export const DYNO_INTEL_TRIGGER_TICKER_INTERVAL_MS = 2400;

export type DynoTriggerPhase = 'online' | 'scanning' | 'coreMax';

const TICKER_ENTRIES = [
  { key: 'dynoIntel.triggerTicker.online', phase: 'online' },
  { key: 'dynoIntel.triggerTicker.scanning', phase: 'scanning' },
  { key: 'dynoIntel.triggerTicker.coreMax', phase: 'coreMax' },
] as const satisfies ReadonlyArray<{ key: string; phase: DynoTriggerPhase }>;

export interface DynoIntelTriggerTickerState {
  label: string;
  phase: DynoTriggerPhase;
  index: number;
  reducedMotion: boolean;
}

export interface UseDynoIntelTriggerTickerOptions {
  /** Pause rotation when the trigger is not mounted visibly (WHY: avoid idle intervals on hidden routes). */
  enabled?: boolean;
}

/** Pure phase lookup — exported for unit tests and B3 expand gating. */
export function resolveDynoTriggerPhaseAtIndex(index: number): DynoTriggerPhase {
  const normalized = ((index % TICKER_ENTRIES.length) + TICKER_ENTRIES.length) % TICKER_ENTRIES.length;
  return TICKER_ENTRIES[normalized]?.phase ?? 'online';
}

/**
 * LED-style status ticker for the floating DYNO INTEL trigger chip.
 *
 * Design intent (WHY): Presentational trigger stays dumb; rotation timing and
 * reduced-motion fallback live here so the chip reads as a live telemetry uplink.
 */
export function useDynoIntelTriggerTicker(
  options: UseDynoIntelTriggerTickerOptions = {},
): DynoIntelTriggerTickerState {
  const { enabled = true } = options;
  const { t } = useTranslation('common');
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reducedMotion || !enabled) return;
    const id = window.setInterval(
      () => setIndex((current) => (current + 1) % TICKER_ENTRIES.length),
      DYNO_INTEL_TRIGGER_TICKER_INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, [reducedMotion, enabled]);

  const activeIndex = reducedMotion || !enabled ? 0 : index;
  const entry = TICKER_ENTRIES[activeIndex] ?? TICKER_ENTRIES[0];

  return {
    label: t(entry.key),
    phase: resolveDynoTriggerPhaseAtIndex(activeIndex),
    index: activeIndex,
    reducedMotion,
  };
}
