import { safeGetItem, safeSetItem } from '../lib/safeLocalStorage';
import type { UnitSystem } from '../logic/core/unitConverters';

/** Display preference only — never store imperial body measurements here. */
export const UNIT_SYSTEM_STORAGE_KEY = 'up.unitSystem';

const VALID: ReadonlySet<string> = new Set(['metric', 'imperial']);

export function loadUnitSystem(): UnitSystem {
  const raw = safeGetItem(UNIT_SYSTEM_STORAGE_KEY);
  if (raw && VALID.has(raw)) return raw as UnitSystem;
  return 'metric';
}

export function saveUnitSystem(system: UnitSystem): void {
  safeSetItem(UNIT_SYSTEM_STORAGE_KEY, system);
}
