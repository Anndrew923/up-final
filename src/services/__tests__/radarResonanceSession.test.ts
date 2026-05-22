import { describe, expect, it, beforeEach } from 'vitest';
import {
  clearPendingRadarResonance,
  consumePendingRadarResonance,
  hasPendingRadarResonance,
  markPendingRadarResonance,
} from '../radarResonanceSession';

describe('radarResonanceSession', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('peeks pending without consuming', () => {
    markPendingRadarResonance();
    expect(hasPendingRadarResonance()).toBe(true);
    expect(hasPendingRadarResonance()).toBe(true);
    expect(consumePendingRadarResonance()).toBe(true);
    expect(hasPendingRadarResonance()).toBe(false);
  });

  it('consumes pending flag once', () => {
    markPendingRadarResonance();
    expect(consumePendingRadarResonance()).toBe(true);
    expect(consumePendingRadarResonance()).toBe(false);
  });

  it('clear removes pending flag', () => {
    markPendingRadarResonance();
    clearPendingRadarResonance();
    expect(consumePendingRadarResonance()).toBe(false);
  });
});
