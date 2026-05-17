import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as localStorageService from '../localStorageService';
import {
  clearPendingRadarResonance,
  consumePendingRadarResonance,
  markPendingRadarResonance,
} from '../radarResonanceSession';

/** Mirrors `useHomeResonanceRitual` mount gate — pending must survive until boot completes. */
function tryConsumeResonanceWhenBootReady(): boolean {
  if (!localStorageService.loadBootSequenceCompleted()) return false;
  return consumePendingRadarResonance();
}

describe('radar resonance boot guard contract', () => {
  beforeEach(() => {
    clearPendingRadarResonance();
    vi.restoreAllMocks();
  });

  it('does not consume pending resonance while boot is incomplete', () => {
    vi.spyOn(localStorageService, 'loadBootSequenceCompleted').mockReturnValue(false);
    markPendingRadarResonance();

    expect(tryConsumeResonanceWhenBootReady()).toBe(false);
    expect(consumePendingRadarResonance()).toBe(true);
  });

  it('consumes pending after boot completes', () => {
    vi.spyOn(localStorageService, 'loadBootSequenceCompleted').mockReturnValue(true);
    markPendingRadarResonance();

    expect(tryConsumeResonanceWhenBootReady()).toBe(true);
    expect(tryConsumeResonanceWhenBootReady()).toBe(false);
  });
});
