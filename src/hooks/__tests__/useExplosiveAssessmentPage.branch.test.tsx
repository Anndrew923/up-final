/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EXPLOSIVE_COMPOSITE_FIXED_DENOMINATOR } from '../../logic/core/powerScoring';
import { useUnitPreferenceStore } from '../../stores/unitPreferenceStore';
import {
  useExplosiveAssessmentPage,
  type UseExplosiveAssessmentPageResult,
} from '../useExplosiveAssessmentPage';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../../services/localStorageService', () => ({
  loadPhysicalProfile: () => ({
    gender: 'male',
    age: 25,
    heightCm: 178,
    weightKg: 75,
    updatedAt: '2026-01-01T00:00:00.000Z',
  }),
  loadPowerInputs: () => ({}),
  savePowerInputs: vi.fn(),
  subscribePhysicalProfile: () => () => undefined,
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

function renderHook(): {
  getLatest: () => UseExplosiveAssessmentPageResult;
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let latest: UseExplosiveAssessmentPageResult | null = null;

  function Harness() {
    latest = useExplosiveAssessmentPage();
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

describe('useExplosiveAssessmentPage calculateBranch', () => {
  beforeEach(() => {
    useUnitPreferenceStore.getState().setUnitSystem('metric');
  });

  afterEach(() => {
    useUnitPreferenceStore.getState().setUnitSystem('metric');
  });

  it('scores vertical jump alone without wiping sibling capacity', () => {
    const { getLatest, unmount } = renderHook();

    act(() => {
      getLatest().setVerticalJumpInput('55');
    });
    act(() => {
      expect(getLatest().calculateBranch('verticalJump')).toBe(true);
    });

    expect(getLatest().perBranchResult.verticalJump?.raw).toBeGreaterThan(0);
    expect(getLatest().perBranchResult.standingLongJump).toBeUndefined();
    expect(getLatest().previewBreakdown).toBeNull();

    unmount();
  });

  it('keeps verticalJump result when standing long jump is calculated next', () => {
    const { getLatest, unmount } = renderHook();

    act(() => {
      getLatest().setVerticalJumpInput('55');
    });
    act(() => {
      expect(getLatest().calculateBranch('verticalJump')).toBe(true);
    });
    const vjRaw = getLatest().perBranchResult.verticalJump!.raw;

    act(() => {
      getLatest().setStandingLongJumpInput('220');
    });
    // Editing SLJ must not clear VJ branch result.
    expect(getLatest().perBranchResult.verticalJump?.raw).toBe(vjRaw);

    act(() => {
      expect(getLatest().calculateBranch('standingLongJump')).toBe(true);
    });

    expect(getLatest().perBranchResult.verticalJump?.raw).toBe(vjRaw);
    expect(getLatest().perBranchResult.standingLongJump?.raw).toBeGreaterThan(0);

    unmount();
  });

  it('composite calculate keeps averageRaw as (vj + slj) / 2', () => {
    const { getLatest, unmount } = renderHook();

    act(() => {
      getLatest().setVerticalJumpInput('55');
      getLatest().setStandingLongJumpInput('220');
    });
    act(() => {
      getLatest().calculate();
    });

    const breakdown = getLatest().previewBreakdown;
    expect(breakdown).not.toBeNull();
    expect(breakdown!.verticalJumpRaw).toBeGreaterThan(0);
    expect(breakdown!.standingLongJumpRaw).toBeGreaterThan(0);
    expect(EXPLOSIVE_COMPOSITE_FIXED_DENOMINATOR).toBe(2);
    expect(breakdown!.averageRaw).toBe(
      Math.round(
        ((breakdown!.verticalJumpRaw! + breakdown!.standingLongJumpRaw!) /
          EXPLOSIVE_COMPOSITE_FIXED_DENOMINATOR) *
          100
      ) / 100
    );

    unmount();
  });

  it('editing one branch clears only that branch result', () => {
    const { getLatest, unmount } = renderHook();

    act(() => {
      getLatest().setVerticalJumpInput('55');
      getLatest().setStandingLongJumpInput('220');
    });
    act(() => {
      expect(getLatest().calculateBranch('verticalJump')).toBe(true);
      expect(getLatest().calculateBranch('standingLongJump')).toBe(true);
    });

    act(() => {
      getLatest().setVerticalJumpInput('56');
    });

    expect(getLatest().perBranchResult.verticalJump).toBeUndefined();
    expect(getLatest().perBranchResult.standingLongJump?.raw).toBeGreaterThan(0);

    unmount();
  });

  it('clears per-branch results when switching tabs', () => {
    const { getLatest, unmount } = renderHook();

    act(() => {
      getLatest().setVerticalJumpInput('55');
    });
    act(() => {
      expect(getLatest().calculateBranch('verticalJump')).toBe(true);
    });
    act(() => {
      getLatest().setActiveTab('sprint');
    });

    expect(getLatest().perBranchResult.verticalJump).toBeUndefined();

    unmount();
  });
});
