/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import HexRadarChart from '../HexRadarChart';
import { SIX_AXIS_METRICS } from '../../../types/scoring';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const basePoints = SIX_AXIS_METRICS.map((key) => ({
  key,
  label: key,
  value: 40,
}));

const comparePoints = SIX_AXIS_METRICS.map((key) => ({
  key,
  label: key,
  value: 70,
}));

describe('HexRadarChart comparison layer', () => {
  let container: HTMLDivElement;
  let root: Root;

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('renders comparison polygon when comparisonPoints provided', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root.render(
        <HexRadarChart
          points={basePoints}
          comparisonPoints={comparePoints}
          scaleMax={100}
          aria-label="compare"
        />
      );
    });

    const comparison = container.querySelector('[data-testid="hex-radar-comparison"]');
    expect(comparison).toBeTruthy();
    // Ritual compare (rare) stays on amber-400 outline — not quiet combat tokens.
    expect(comparison?.getAttribute('stroke')).toBe('#fbbf24');
    expect(comparison?.getAttribute('stroke-dasharray')).toBe('5 4');
    expect(comparison?.getAttribute('fill')).toBe('none');
  });

  it('omits comparison polygon for single-layer charts', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root.render(<HexRadarChart points={basePoints} scaleMax={100} aria-label="solo" />);
    });

    expect(container.querySelector('[data-testid="hex-radar-comparison"]')).toBeNull();
  });

  it('quiet combat aesthetic: dense fills, no scanner, long-dash gold compare', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root.render(
        <HexRadarChart
          presentation="quiet"
          points={basePoints}
          comparisonPoints={comparePoints}
          scaleMax={100}
          aria-label="quiet-compare"
        />
      );
    });

    expect(container.querySelector('[data-radar-presentation="quiet"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="hex-radar-scanner"]')).toBeNull();

    const primary = container.querySelector('[data-testid="hex-radar-primary"]');
    expect(primary?.getAttribute('stroke')).toBe('#22d3ee');
    expect(primary?.getAttribute('stroke-width')).toBe('2');
    expect(primary?.getAttribute('fill')).toBe('rgba(6, 182, 212, 0.22)');

    const comparison = container.querySelector('[data-testid="hex-radar-comparison"]');
    expect(comparison?.getAttribute('fill')).toBe('rgba(245, 158, 11, 0.16)');
    expect(comparison?.getAttribute('stroke')).toBe('#f59e0b');
    expect(comparison?.getAttribute('stroke-width')).toBe('1.5');
    expect(comparison?.getAttribute('stroke-dasharray')).toBe('5 3');
  });

  it('ritual presentation keeps scanner backdrop by default', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root.render(<HexRadarChart points={basePoints} scaleMax={100} aria-label="ritual" />);
    });

    expect(container.querySelector('[data-radar-presentation="ritual"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="hex-radar-scanner"]')).toBeTruthy();
  });
});
