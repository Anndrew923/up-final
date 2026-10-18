/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import RadarPkCompareLegend from '../RadarPkCompareLegend';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('RadarPkCompareLegend', () => {
  let root: Root;

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    document.body.innerHTML = '';
  });

  it('uses solid cyan/amber swatches matching quiet PK chart tokens', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root.render(
        <RadarPkCompareLegend
          memberLabel="Rival"
          viewerLabel="Anndrew"
          ariaLabel="legend"
        />
      );
    });

    const target = document.body.querySelector(
      '[data-testid="radar-pk-legend-target-swatch"]'
    ) as HTMLElement;
    const viewer = document.body.querySelector(
      '[data-testid="radar-pk-legend-viewer-swatch"]'
    ) as HTMLElement;

    expect(target.className).toContain('bg-cyan-400');
    expect(target.className).not.toContain('dashed');
    expect(viewer.className).toContain('bg-amber-500');
    expect(viewer.className).not.toContain('dashed');
    expect(viewer.className).not.toContain('bg-transparent');
  });
});
