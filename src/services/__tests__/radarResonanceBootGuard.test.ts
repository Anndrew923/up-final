import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as localStorageService from '../localStorageService';
import {
  clearPendingRadarResonance,
  consumePendingRadarResonance,
  hasPendingRadarResonance,
  markPendingRadarResonance,
} from '../radarResonanceSession';

/** Mirrors `useHomeResonanceRitual` mount gate — pending is peeked until boot completes. */
function canAutoStartResonanceWhenBootReady(): boolean {
  if (!localStorageService.loadBootSequenceCompleted()) return false;
  return hasPendingRadarResonance();
}

describe('radar resonance boot guard contract', () => {
  beforeEach(() => {
    clearPendingRadarResonance();
    vi.restoreAllMocks();
  });

  it('does not auto-start while boot is incomplete and leaves pending intact', () => {
    vi.spyOn(localStorageService, 'loadBootSequenceCompleted').mockReturnValue(false);
    markPendingRadarResonance();

    expect(canAutoStartResonanceWhenBootReady()).toBe(false);
    expect(hasPendingRadarResonance()).toBe(true);
    expect(consumePendingRadarResonance()).toBe(true);
  });

  it('allows auto-start peek after boot completes without consuming yet', () => {
    vi.spyOn(localStorageService, 'loadBootSequenceCompleted').mockReturnValue(true);
    markPendingRadarResonance();

    expect(canAutoStartResonanceWhenBootReady()).toBe(true);
    expect(hasPendingRadarResonance()).toBe(true);
    expect(consumePendingRadarResonance()).toBe(true);
    expect(hasPendingRadarResonance()).toBe(false);
  });
});
