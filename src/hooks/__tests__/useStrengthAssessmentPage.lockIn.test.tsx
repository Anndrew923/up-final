/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUnitPreferenceStore } from '../../stores/unitPreferenceStore';
import {
  useStrengthAssessmentPage,
  type UseStrengthAssessmentPageResult,
} from '../useStrengthAssessmentPage';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../services/localStorageService', () => ({
  loadPhysicalProfile: () => ({
    gender: 'male',
    age: 30,
    heightCm: 180,
    weightKg: 80,
    updatedAt: '2026-01-01T00:00:00.000Z',
  }),
  loadStrengthInputs: () => ({
    lifts: {
      benchPress: { weightKg: 100, reps: 5 },
    },
  }),
  saveStrengthInputs: vi.fn(),
  subscribePhysicalProfile: () => () => undefined,
  subscribeStrengthInputs: () => () => undefined,
}));

vi.mock('../../services/radarResonanceNavigation', () => ({
  navigateHomeWithResonance: vi.fn(),
}));

vi.mock('../../services/structuredSyncAfterRadarSubmit', () => ({
  queueStructuredProfileAfterRadarSubmit: vi.fn(),
}));

vi.mock('../../stores/scoreStore', () => ({
  useScoreStore: (sel: (s: { setScore: () => void }) => unknown) => sel({ setScore: vi.fn() }),
}));

vi.mock('../../stores/dynoIntelScoreDraftStore', () => ({
  useDynoIntelScoreDraftStore: (
    sel: (s: { setLiveScore: () => void; clearLiveScore: () => void }) => unknown
  ) => sel({ setLiveScore: vi.fn(), clearLiveScore: vi.fn() }),
}));

function renderHook(): {
  getLatest: () => UseStrengthAssessmentPageResult;
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let latest: UseStrengthAssessmentPageResult | null = null;

  function Harness() {
    latest = useStrengthAssessmentPage();
    return null;
  }

  act(() => {
    root.render(React.createElement(Harness));
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

describe('useStrengthAssessmentPage Armed & Lock-In', () => {
  beforeEach(() => {
    useUnitPreferenceStore.getState().setUnitSystem('metric');
  });

  afterEach(() => {
    useUnitPreferenceStore.getState().setUnitSystem('metric');
  });

  it('hydrates Clean (not Armed) even when persisted lift inputs exist', () => {
    const { getLatest, unmount } = renderHook();
    expect(getLatest().isLiftArmed('benchPress')).toBe(false);
    expect(getLatest().isLiftLocked('benchPress')).toBe(false);
    expect(getLatest().form.benchPress.weight).toBe('100');
    unmount();
  });

  it('arms on edit, locks on successful calculate, rearms on further edit', () => {
    const { getLatest, unmount } = renderHook();

    act(() => {
      getLatest().setWeight('benchPress', '110');
    });
    expect(getLatest().isLiftArmed('benchPress')).toBe(true);
    expect(getLatest().isLiftLocked('benchPress')).toBe(false);

    let ok = false;
    act(() => {
      ok = getLatest().calculateLift('benchPress');
    });
    expect(ok).toBe(true);
    expect(getLatest().isLiftArmed('benchPress')).toBe(false);
    expect(getLatest().isLiftLocked('benchPress')).toBe(true);
    expect(getLatest().perLiftResult.benchPress?.oneRepMax).toBeGreaterThan(0);

    act(() => {
      getLatest().setReps('benchPress', '3');
    });
    expect(getLatest().isLiftArmed('benchPress')).toBe(true);
    expect(getLatest().isLiftLocked('benchPress')).toBe(false);
    expect(getLatest().perLiftResult.benchPress).toBeUndefined();

    unmount();
  });

  it('does not arm sibling lifts when one lift is edited', () => {
    const { getLatest, unmount } = renderHook();

    act(() => {
      getLatest().setWeight('benchPress', '105');
    });
    expect(getLatest().isLiftArmed('benchPress')).toBe(true);
    expect(getLatest().isLiftArmed('squat')).toBe(false);
    expect(getLatest().isLiftArmed('deadlift')).toBe(false);

    unmount();
  });
});
