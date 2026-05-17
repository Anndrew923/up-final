import { create } from 'zustand';

export interface UiInteractionStore {
  isHomeResonanceBlocking: boolean;
  setHomeResonanceBlocking: (blocking: boolean) => void;
}

export const useUiInteractionStore = create<UiInteractionStore>((set) => ({
  isHomeResonanceBlocking: false,
  setHomeResonanceBlocking: (blocking) => set({ isHomeResonanceBlocking: blocking }),
}));
