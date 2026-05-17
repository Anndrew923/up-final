import { create } from 'zustand';

/** `0` = boot overlay off; `1–3` = active spotlight phase. */
export type BootSequencePhase = 0 | 1 | 2 | 3;

export interface UiInteractionStore {
  isHomeResonanceBlocking: boolean;
  isBootSequenceBlocking: boolean;
  bootSequencePhase: BootSequencePhase;
  setHomeResonanceBlocking: (blocking: boolean) => void;
  setBootSequencePhase: (phase: BootSequencePhase) => void;
}

export const useUiInteractionStore = create<UiInteractionStore>((set) => ({
  isHomeResonanceBlocking: false,
  isBootSequenceBlocking: false,
  bootSequencePhase: 0,
  setHomeResonanceBlocking: (blocking) => set({ isHomeResonanceBlocking: blocking }),
  setBootSequencePhase(phase) {
    set({
      bootSequencePhase: phase,
      isBootSequenceBlocking: phase !== 0,
    });
  },
}));

/** Shell-level dim / pointer lock while ritual overlays are active. */
export function useShellInteractionBlocked(): boolean {
  return useUiInteractionStore(
    (s) => s.isHomeResonanceBlocking || s.isBootSequenceBlocking,
  );
}
