import { create } from 'zustand';
import {
  loadBootSequenceCompleted,
  saveBootSequenceCompleted,
} from '../services/localStorageService';

export interface BootSequenceStore {
  completed: boolean;
  completeBoot: () => void;
  resetBoot: () => void;
}

export const useBootSequenceStore = create<BootSequenceStore>((set) => ({
  completed: loadBootSequenceCompleted(),
  completeBoot() {
    saveBootSequenceCompleted(true);
    set({ completed: true });
  },
  resetBoot() {
    saveBootSequenceCompleted(false);
    set({ completed: false });
  },
}));
