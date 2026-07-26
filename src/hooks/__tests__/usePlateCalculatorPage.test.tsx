/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PLATE_SET_PRESETS_KG, PLATE_SET_PRESETS_LB } from '../../logic/core/trainingTools';
import { useUnitPreferenceStore } from '../../stores/unitPreferenceStore';
import { usePlateCalculatorPage } from '../usePlateCalculatorPage';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function renderHook(): {
  getLatest: () => ReturnType<typeof usePlateCalculatorPage>;
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let latest: ReturnType<typeof usePlateCalculatorPage> | null = null;

  function Harness() {
    latest = usePlateCalculatorPage();
    return null;
  }

  act(() => {
    root.render(<Harness />);
  });

  return {
    getLatest: () => {
      if (!latest) throw new Error('hook not mounted');
      return latest;
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('usePlateCalculatorPage', () => {
  beforeEach(() => {
    useUnitPreferenceStore.getState().setUnitSystem('metric');
  });

  afterEach(() => {
    document.body.innerHTML = '';
    useUnitPreferenceStore.getState().setUnitSystem('metric');
  });

  it('defaults to kg olympic bar (20) and commercial plate set', () => {
    const { getLatest, unmount } = renderHook();
    const latest = getLatest();
    expect(latest.unit).toBe('kg');
    expect(latest.barWeightInput).toBe('20');
    expect(latest.resolvedBarWeightDisplay).toBe(20);
    expect(latest.activePlateSetDisplay).toEqual([...PLATE_SET_PRESETS_KG.commercial]);
    unmount();
  });

  it('resets bar to 45 lb when switching unit to pounds', () => {
    const { getLatest, unmount } = renderHook();
    act(() => {
      useUnitPreferenceStore.getState().setUnitSystem('imperial');
    });
    const latest = getLatest();
    expect(latest.unit).toBe('lb');
    expect(latest.barWeightInput).toBe('45');
    expect(latest.activePlateSetDisplay).toEqual([...PLATE_SET_PRESETS_LB.commercial]);
    unmount();
  });

  it('reprojects target total when switching unit systems', () => {
    const { getLatest, unmount } = renderHook();
    act(() => {
      getLatest().setTargetTotalInput('100');
    });
    act(() => {
      useUnitPreferenceStore.getState().setUnitSystem('imperial');
    });
    const latest = getLatest();
    expect(latest.unit).toBe('lb');
    expect(Number(latest.targetTotalInput)).toBeCloseTo(220.46, 1);
    expect(latest.barWeightInput).toBe('45');
    unmount();
  });

  it('plans commercial loading for a standard target', () => {
    const { getLatest, unmount } = renderHook();
    act(() => {
      getLatest().setTargetTotalInput('140');
    });
    const latest = getLatest();
    expect(latest.hasResult).toBe(true);
    expect(latest.perSideDisplay).toBe(60);
    expect(latest.isExactMatch).toBe(true);
    unmount();
  });
});
