import { describe, expect, it } from 'vitest';
import { SIX_AXIS_METRICS } from '../../../types/scoring';
import {
  computeSixAxisRadarVertices,
  formatRadarPolygonAttr,
} from '../radarGeometry';
import { radarOverflowExtraRadius } from '../scoring';

const sixPoints = SIX_AXIS_METRICS.map((key) => ({
  key,
  label: key,
  value: 50,
}));

describe('computeSixAxisRadarVertices', () => {
  it('places axis 0 at the top of the 100-ring', () => {
    const geometry = computeSixAxisRadarVertices({
      points: sixPoints,
      cx: 100,
      cy: 100,
      outerRadius: 72,
      labelRadius: 90,
    });

    expect(geometry.vertices).toHaveLength(6);
    expect(geometry.hexagon).toHaveLength(6);
    expect(geometry.scorePolygon).toHaveLength(6);

    const strength = geometry.vertices[0];
    expect(strength?.key).toBe('strength');
    expect(strength?.xOuter).toBeCloseTo(100, 5);
    expect(strength?.yOuter).toBeCloseTo(28, 5);
    // Half fill on the top spoke: cy - 0.5 * outerRadius.
    expect(strength?.xBase).toBeCloseTo(100, 5);
    expect(strength?.yBase).toBeCloseTo(64, 5);
    expect(strength?.textAnchor).toBe('middle');
    expect(strength?.dominantBaseline).toBe('auto');
    expect(geometry.hasOverflow).toBe(false);
  });

  it('keeps score vertices on the 100-ring when raw exceeds scaleMax', () => {
    const geometry = computeSixAxisRadarVertices({
      points: SIX_AXIS_METRICS.map((key, index) => ({
        key,
        label: key,
        value: index === 0 ? 150 : 40,
      })),
      cx: 100,
      cy: 100,
      outerRadius: 72,
      labelRadius: 90,
      scaleMax: 100,
    });

    const strength = geometry.vertices[0];
    expect(strength?.raw).toBe(150);
    expect(strength?.xBase).toBeCloseTo(strength?.xOuter ?? 0, 5);
    expect(strength?.yBase).toBeCloseTo(strength?.yOuter ?? 0, 5);
  });

  it('emits overflow burst past the hex for scores above 100', () => {
    const geometry = computeSixAxisRadarVertices({
      points: SIX_AXIS_METRICS.map((key, index) => ({
        key,
        label: key,
        value: index === 0 ? 200 : 50,
      })),
      cx: 100,
      cy: 100,
      outerRadius: 72,
      labelRadius: 90,
    });

    const strength = geometry.vertices[0];
    const expectedExtra = radarOverflowExtraRadius(200);
    expect(expectedExtra).toBe(24);
    expect(strength?.overflowing).toBe(true);
    expect(strength?.overflowExtra).toBe(24);
    expect(strength?.yOverflow).toBeCloseTo(100 - (72 + 24), 5);
    expect(geometry.hasOverflow).toBe(true);
    expect(geometry.maxOverflowExtra).toBe(24);
    expect(geometry.overflowPolygon[0]?.y).toBeCloseTo(strength?.yOverflow ?? 0, 5);
  });

  it('scales score radius and overflow extra with ritual fill, not the hex ring', () => {
    const geometry = computeSixAxisRadarVertices({
      points: SIX_AXIS_METRICS.map((key, index) => ({
        key,
        label: key,
        value: index === 0 ? 200 : 0,
      })),
      cx: 100,
      cy: 100,
      outerRadius: 72,
      labelRadius: 90,
      fill: 0.5,
    });

    const strength = geometry.vertices[0];
    expect(strength?.yOuter).toBeCloseTo(28, 5);
    expect(strength?.yBase).toBeCloseTo(100 - 72 * 0.5, 5);
    expect(strength?.overflowExtra).toBeCloseTo(12, 5);
    expect(strength?.yOverflow).toBeCloseTo(100 - (72 + 12), 5);
  });

  it('anchors right-side labels to start', () => {
    const geometry = computeSixAxisRadarVertices({
      points: sixPoints,
      cx: 100,
      cy: 100,
      outerRadius: 72,
      labelRadius: 90,
    });
    // Index 1 is 60° clockwise from top — ux is positive.
    expect(geometry.vertices[1]?.textAnchor).toBe('start');
    expect(geometry.vertices[5]?.textAnchor).toBe('end');
  });

  it('returns an empty geometry for an empty point list', () => {
    const geometry = computeSixAxisRadarVertices({
      points: [],
      cx: 100,
      cy: 100,
      outerRadius: 72,
      labelRadius: 90,
    });
    expect(geometry.vertices).toEqual([]);
    expect(geometry.hexagon).toEqual([]);
    expect(geometry.hasOverflow).toBe(false);
    expect(formatRadarPolygonAttr(geometry.scorePolygon)).toBe('');
  });
});
