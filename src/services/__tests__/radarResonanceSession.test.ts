import { describe, expect, it, beforeEach } from 'vitest';
import {
  clearPendingRadarResonance,
  consumePendingRadarResonance,
  markPendingRadarResonance,
} from '../radarResonanceSession';

describe('radarResonanceSession', () => {
  beforeEach(() => {
    sessionStorage.clear();
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
