import { create } from 'zustand';
import type { UnitSystem } from '../logic/core/unitConverters';
import { loadUnitSystem, saveUnitSystem } from '../services/unitPreferenceService';

export interface UnitPreferenceStore {
  unitSystem: UnitSystem;
  setUnitSystem: (system: UnitSystem) => void;
}

export const useUnitPreferenceStore = create<UnitPreferenceStore>((set) => ({
  unitSystem: loadUnitSystem(),
  setUnitSystem(system) {
    // Persist first; still apply in-session so UI stays responsive if disk write fails.
    saveUnitSystem(system);
    set({ unitSystem: system });
  },
}));
