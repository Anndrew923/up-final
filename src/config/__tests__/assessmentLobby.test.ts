import { describe, expect, it } from 'vitest';
import { SIX_AXIS_METRICS } from '../../types/scoring';
import {
  ASSESSMENT_LOBBY_CARD_KEYS,
  ASSESSMENT_LOBBY_ROUTES,
  ASSESSMENT_LOBBY_STATUS_BAR_CLASS,
  LOBBY_BENTO_LAYOUT,
  SIX_AXIS_LOBBY_GRID_ORDER,
  SIX_AXIS_SNAPSHOT_LEFT_AXES,
  SIX_AXIS_SNAPSHOT_RIGHT_AXES,
} from '../assessmentLobby';

describe('assessmentLobby config', () => {
  it('defines three-layer Bento with chassis as CHSS∥P2W then full-width STINT', () => {
    expect(LOBBY_BENTO_LAYOUT.map((slot) => slot.key)).toEqual([
      'strength',
      'grip',
      'explosive',
      'muscle',
      'ffmi',
      'cardio',
      'armSize',
    ]);
    expect(LOBBY_BENTO_LAYOUT.filter((s) => s.layer === 'power').map((s) => s.key)).toEqual([
      'strength',
      'grip',
      'explosive',
    ]);
    expect(LOBBY_BENTO_LAYOUT.filter((s) => s.layer === 'chassis').map((s) => s.key)).toEqual([
      'muscle',
      'ffmi',
      'cardio',
    ]);
    expect(LOBBY_BENTO_LAYOUT.filter((s) => s.layer === 'specialty').map((s) => s.key)).toEqual([
      'armSize',
    ]);
    expect(LOBBY_BENTO_LAYOUT[0]).toEqual({
      key: 'strength',
      size: 'hero',
      colSpan: 2,
      layer: 'power',
    });
    expect(LOBBY_BENTO_LAYOUT.find((s) => s.key === 'muscle')).toMatchObject({
      size: 'capsule',
      colSpan: 1,
      layer: 'chassis',
    });
    expect(LOBBY_BENTO_LAYOUT.find((s) => s.key === 'ffmi')).toMatchObject({
      size: 'standard',
      colSpan: 1,
      layer: 'chassis',
    });
    expect(LOBBY_BENTO_LAYOUT.find((s) => s.key === 'cardio')).toMatchObject({
      size: 'capsule',
      colSpan: 2,
      layer: 'chassis',
    });
  });

  it('derives ASSESSMENT_LOBBY_CARD_KEYS from Bento layout order', () => {
    expect(ASSESSMENT_LOBBY_CARD_KEYS).toEqual(LOBBY_BENTO_LAYOUT.map((slot) => slot.key));
    expect(new Set(ASSESSMENT_LOBBY_CARD_KEYS).size).toBe(ASSESSMENT_LOBBY_CARD_KEYS.length);
  });

  it('keeps six-axis snapshot order decoupled from Bento visual order', () => {
    expect(SIX_AXIS_LOBBY_GRID_ORDER).toEqual([
      'strength',
      'gripStrength',
      'bodyFat',
      'explosivePower',
      'cardio',
      'muscleMass',
    ]);
    expect(new Set(SIX_AXIS_LOBBY_GRID_ORDER).size).toBe(SIX_AXIS_METRICS.length);
    expect([...SIX_AXIS_LOBBY_GRID_ORDER].sort()).toEqual([...SIX_AXIS_METRICS].sort());
    // Bento chassis pairs muscle∥ffmi then full-width cardio — snapshot map stays legacy order.
    expect(LOBBY_BENTO_LAYOUT.map((s) => s.key).slice(3, 6)).toEqual([
      'muscle',
      'ffmi',
      'cardio',
    ]);
  });

  it('derives six-axis snapshot columns from the lobby row-major map', () => {
    expect(SIX_AXIS_SNAPSHOT_LEFT_AXES).toEqual([
      SIX_AXIS_LOBBY_GRID_ORDER[0],
      SIX_AXIS_LOBBY_GRID_ORDER[2],
      SIX_AXIS_LOBBY_GRID_ORDER[4],
    ]);
    expect(SIX_AXIS_SNAPSHOT_RIGHT_AXES).toEqual([
      SIX_AXIS_LOBBY_GRID_ORDER[1],
      SIX_AXIS_LOBBY_GRID_ORDER[3],
      SIX_AXIS_LOBBY_GRID_ORDER[5],
    ]);
    expect(SIX_AXIS_SNAPSHOT_LEFT_AXES).toEqual(['strength', 'bodyFat', 'cardio']);
    expect(SIX_AXIS_SNAPSHOT_RIGHT_AXES).toEqual([
      'gripStrength',
      'explosivePower',
      'muscleMass',
    ]);
    expect(
      [...SIX_AXIS_SNAPSHOT_LEFT_AXES, ...SIX_AXIS_SNAPSHOT_RIGHT_AXES].sort()
    ).toEqual([...SIX_AXIS_METRICS].sort());
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
