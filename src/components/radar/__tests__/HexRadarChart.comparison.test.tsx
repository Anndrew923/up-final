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
    expect(comparison?.getAttribute('stroke')).toBe('#fbbf24');
    expect(comparison?.getAttribute('stroke-dasharray')).toBe('5 4');
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
});
