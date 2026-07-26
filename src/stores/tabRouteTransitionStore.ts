import { create } from 'zustand';

export type TabRouteTransitionPhase = 'idle' | 'sprint' | 'settle';

export interface TabRouteTransitionStore {
  phase: TabRouteTransitionPhase;
  /** Monotonic id — listeners fire once per tab transition cycle. */
  generation: number;
  startSprint: () => void;
  /** Called when ShellAnimatedOutlet enter window completes (central clock). */
  completeSettle: () => void;
  finish: () => void;
  cancel: () => void;
}

/**
 * Central motion clock for tab enter (WHY: TopProgressBar + PDK Ack share one timeline).
 */
export const useTabRouteTransitionStore = create<TabRouteTransitionStore>((set) => ({
  phase: 'idle',
  generation: 0,
  startSprint() {
    set((state) => ({
      phase: 'sprint',
      generation: state.generation + 1,
    }));
  },
  completeSettle() {
    set({ phase: 'settle' });
  },
  finish() {
    set({ phase: 'idle' });
  },
  cancel() {
    set({ phase: 'idle' });
  },
}));
