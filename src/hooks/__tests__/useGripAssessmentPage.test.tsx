/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUnitPreferenceStore } from '../../stores/unitPreferenceStore';
import { useGripAssessmentPage } from '../useGripAssessmentPage';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const saveGripInputs = vi.fn();
const setStoreScore = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../../services/localStorageService', () => ({
  loadPhysicalProfile: () => ({
    gender: 'male',
    age: 30,
    heightCm: 175,
    weightKg: 75,
    jobCategory: 'coach',
    countryCode: 'TW',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }),
  loadGripInputs: () => ({ peakKg: 65 }),
  saveGripInputs: (...args: unknown[]) => saveGripInputs(...args),
  subscribePhysicalProfile: () => () => undefined,
}));

vi.mock('../../services/radarResonanceNavigation', () => ({
  navigateHomeWithResonance: vi.fn(),
}));

vi.mock('../../services/structuredSyncAfterRadarSubmit', () => ({
  queueStructuredProfileAfterRadarSubmit: vi.fn(),
}));

vi.mock('../../stores/scoreStore', () => ({
  useScoreStore: (sel: (s: { setScore: typeof setStoreScore }) => unknown) =>
    sel({ setScore: setStoreScore }),
}));

function renderHook(): {
  getLatest: () => ReturnType<typeof useGripAssessmentPage>;
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let latest: ReturnType<typeof useGripAssessmentPage> | null = null;

  function Harness() {
    latest = useGripAssessmentPage();
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

describe('useGripAssessmentPage units', () => {
  beforeEach(() => {
    saveGripInputs.mockReset();
    setStoreScore.mockReset();
    useUnitPreferenceStore.getState().setUnitSystem('metric');
  });

  afterEach(() => {
    useUnitPreferenceStore.getState().setUnitSystem('metric');
  });

  it('loads saved peakKg into display units and persists metric kg', () => {
    const { getLatest, unmount } = renderHook();
    expect(getLatest().peakInput).toBe('65');

    act(() => {
      useUnitPreferenceStore.getState().setUnitSystem('imperial');
    });
    expect(Number(getLatest().peakInput)).toBeCloseTo(143.3, 0);

    act(() => {
      getLatest().setPeakInput('220.5');
    });
    act(() => {
      expect(getLatest().persistToDashboard()).toBe(true);
    });

    expect(saveGripInputs).toHaveBeenCalledWith(
      expect.objectContaining({ peakKg: expect.any(Number) })
    );
    const savedKg = (saveGripInputs.mock.calls[0]?.[0] as { peakKg: number }).peakKg;
    expect(savedKg).toBeCloseTo(100, 0);

    unmount();
  });
});
