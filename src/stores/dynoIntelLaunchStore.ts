import { create } from 'zustand';

/**
 * Cross-tree handoff: assessment Hall Spectrum CTA → DynoIntelConsole.
 * WHY: Console owns sheet gates/quota; pages must not import DynoIntelConsole or open a second sheet.
 */
interface DynoIntelLaunchStore {
  pendingPrompt: string | null;
  /**
   * Monotonic token so a *new* prompt (or re-launch after clear) retriggers Console open.
   * Identical text while still pending is coalesced — see requestLaunch.
   */
  requestId: number;
  requestLaunch: (prompt: string) => void;
  clearPending: () => void;
}

export const useDynoIntelLaunchStore = create<DynoIntelLaunchStore>((set) => ({
  pendingPrompt: null,
  requestId: 0,
  requestLaunch(prompt) {
    const trimmed = String(prompt ?? '').trim();
    if (!trimmed) return;
    set((state) => {
      // WHY: Ghost touch+click (or StrictMode) must not bump requestId for the same
      // pending decode — each bump can schedule a parallel flush before the lock settles.
      if (state.pendingPrompt === trimmed) {
        return state;
      }
      return {
        pendingPrompt: trimmed,
        requestId: state.requestId + 1,
      };
    });
  },
  clearPending() {
    set({ pendingPrompt: null });
  },
}));
