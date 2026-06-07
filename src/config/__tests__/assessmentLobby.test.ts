import { describe, expect, it } from 'vitest';
import { SIX_AXIS_METRICS } from '../../types/scoring';
import {
  ASSESSMENT_LOBBY_CARD_KEYS,
  ASSESSMENT_LOBBY_FULL_WIDTH_CARD_KEY,
  ASSESSMENT_LOBBY_ROUTES,
  ASSESSMENT_LOBBY_STATUS_BAR_CLASS,
  ASSESSMENT_RAW_INPUT_GRID_ORDER,
} from '../assessmentLobby';

describe('assessmentLobby config', () => {
  it('places ffmi in row 2 and armSize as the full-width bottom card', () => {
    expect(ASSESSMENT_LOBBY_CARD_KEYS).toEqual([
      'strength',
      'grip',
      'ffmi',
      'explosive',
      'cardio',
      'muscle',
      'armSize',
    ]);
    expect(ASSESSMENT_LOBBY_FULL_WIDTH_CARD_KEY).toBe('armSize');
  });

  it('orders raw inputs to mirror the six radar lobby card grid', () => {
    expect(ASSESSMENT_RAW_INPUT_GRID_ORDER).toEqual([
      'strength',
      'gripStrength',
      'bodyFat',
      'explosivePower',
      'cardio',
      'muscleMass',
    ]);
    expect(new Set(ASSESSMENT_RAW_INPUT_GRID_ORDER).size).toBe(SIX_AXIS_METRICS.length);
    expect([...ASSESSMENT_RAW_INPUT_GRID_ORDER].sort()).toEqual([...SIX_AXIS_METRICS].sort());
  });

  it('maps every lobby card key to a non-empty route', () => {
    for (const key of ASSESSMENT_LOBBY_CARD_KEYS) {
      expect(ASSESSMENT_LOBBY_ROUTES[key]).toMatch(/^\//);
    }
  });

  it('keeps keys and routes in sync', () => {
    expect(Object.keys(ASSESSMENT_LOBBY_ROUTES).sort()).toEqual(
      [...ASSESSMENT_LOBBY_CARD_KEYS].sort()
    );
  });

  it('defines status bar styles for every lobby card key', () => {
    for (const key of ASSESSMENT_LOBBY_CARD_KEYS) {
      expect(ASSESSMENT_LOBBY_STATUS_BAR_CLASS[key]?.length).toBeGreaterThan(0);
    }
  });

  it('assigns unique status bar bg tokens across the warm–cool crossflow grid', () => {
    const bgTokens = ASSESSMENT_LOBBY_CARD_KEYS.map((key) =>
      ASSESSMENT_LOBBY_STATUS_BAR_CLASS[key].split(' ')[0]
    );
    expect(new Set(bgTokens).size).toBe(ASSESSMENT_LOBBY_CARD_KEYS.length);
  });
});
