import { create } from 'zustand';

/**
 * Cross-tree handoff: assessment Hall Spectrum CTA → DynoIntelConsole.
 * WHY: Console owns sheet gates/quota; pages must not import DynoIntelConsole or open a second sheet.
 */
interface DynoIntelLaunchStore {
  pendingPrompt: string | null;
  /** Monotonic token so identical prompts still retrigger Console open. */
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
    set((state) => ({
      pendingPrompt: trimmed,
      requestId: state.requestId + 1,
    }));
  },
  clearPending() {
    set({ pendingPrompt: null });
  },
}));
