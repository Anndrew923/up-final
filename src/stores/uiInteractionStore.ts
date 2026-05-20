import { create } from 'zustand';
import type { BootSequenceVariant } from '../types/bootSequence';

/** `0` = boot overlay off; `1–3` = spotlight phase (radar / assess on 2 & 3). */
export type BootSequencePhase = 0 | 1 | 2 | 3;

export interface UiInteractionStore {
  isHomeResonanceBlocking: boolean;
  isBootSequenceBlocking: boolean;
  bootSequencePhase: BootSequencePhase;
  bootSequenceVariant: BootSequenceVariant | 'none';
  setHomeResonanceBlocking: (blocking: boolean) => void;
  /** @deprecated Prefer `setBootSequenceStep` — kept for narrow store resets. */
  setBootSequencePhase: (phase: BootSequencePhase) => void;
  setBootSequenceStep: (payload: {
    phase: BootSequencePhase;
    variant: BootSequenceVariant | 'none';
  }) => void;
}

export const useUiInteractionStore = create<UiInteractionStore>((set) => ({
  isHomeResonanceBlocking: false,
  isBootSequenceBlocking: false,
  bootSequencePhase: 0,
  bootSequenceVariant: 'none',
  setHomeResonanceBlocking: (blocking) => set({ isHomeResonanceBlocking: blocking }),
  setBootSequencePhase(phase) {
    set({
      bootSequencePhase: phase,
      isBootSequenceBlocking: phase !== 0,
      bootSequenceVariant: phase === 0 ? 'none' : 'narrative',
    });
  },
  setBootSequenceStep({ phase, variant }) {
    set({
      bootSequencePhase: phase,
      bootSequenceVariant: variant,
      isBootSequenceBlocking: phase !== 0 || variant !== 'none',
    });
  },
}));

/** Shell-level dim / pointer lock while ritual overlays are active. */
export function useShellInteractionBlocked(): boolean {
  return useUiInteractionStore((s) => s.isHomeResonanceBlocking || s.isBootSequenceBlocking);
}
