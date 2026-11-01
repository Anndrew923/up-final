import { describe, expect, it, beforeEach } from 'vitest';
import {
  claimRadarArrivalDelivery,
  clearPendingRadarResonance,
  consumePendingRadarResonance,
  hasPendingRadarResonance,
  markPendingRadarResonance,
  settleRadarArrivalDelivery,
} from '../radarResonanceSession';

describe('radarResonanceSession', () => {
  beforeEach(() => {
    clearPendingRadarResonance();
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

  it('claim consumes pending then keeps delivery live until settle', () => {
    markPendingRadarResonance();
    expect(claimRadarArrivalDelivery()).toBe(true);
    expect(hasPendingRadarResonance()).toBe(false);
    expect(claimRadarArrivalDelivery()).toBe(true);

    settleRadarArrivalDelivery();
    expect(claimRadarArrivalDelivery()).toBe(false);
  });
});
