/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PhysicalProfile } from '../../types/userProfile';
import { useUnitPreferenceStore } from '../../stores/unitPreferenceStore';
import { useSingleLiftMilestoneHint } from '../useSingleLiftMilestoneHint';
import type { ScoreMeaningResult } from '../useScoreMeaning';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'strength.liftNextMilestoneHint') {
        return `${String(options?.points)} pts until next tier upgrade`;
      }
      if (key === 'strength.liftNextMilestoneHintWithRaw') {
        return `${String(options?.points)} pts until next tier upgrade (approx. +${String(options?.delta)} ${String(options?.unit)})`;
      }
      if (key === 'units.weight.kg') return 'kg';
      if (key === 'units.weight.lb') return 'lb';
      return key;
    },
  }),
}));

const profile: PhysicalProfile = {
  gender: 'male',
  age: 28,
  heightCm: 178,
  weightKg: 80,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const meaning: ScoreMeaningResult = {
  title: 'Spec',
  summary: 'Summary',
  nextMilestone: 80,
  remainingPoints: 6,
};

function renderHint(
  scoreMeaning: ScoreMeaningResult | null,
  weightKg: number | null,
  reps: number | null,
  readyProfile: PhysicalProfile | null,
  profileReady: boolean
): { getLatest: () => string | null; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let latest: string | null = null;

  function Harness() {
    latest = useSingleLiftMilestoneHint(
      'benchPress',
      scoreMeaning,
      weightKg,
      reps,
      readyProfile,
      profileReady
    );
    return null;
  }

  act(() => {
    root.render(<Harness />);
  });

  return {
    getLatest: () => latest,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('useSingleLiftMilestoneHint', () => {
  beforeEach(() => {
    useUnitPreferenceStore.getState().setUnitSystem('metric');
  });

  afterEach(() => {
    useUnitPreferenceStore.getState().setUnitSystem('metric');
  });

  it('returns Δkg raw gap beside points when weight + reps resolve', () => {
    const { getLatest, unmount } = renderHint(meaning, 80, 5, profile, true);
    expect(getLatest()).toMatch(
      /6 pts until next tier upgrade \(approx\. \+\d+(\.\d)? kg\)/
    );
    unmount();
  });

  it('ceil1Display imperial lb so display cannot under-promise verified kg', () => {
    useUnitPreferenceStore.getState().setUnitSystem('imperial');
    const { getLatest, unmount } = renderHint(meaning, 80, 5, profile, true);
    const text = getLatest() ?? '';
    expect(text).toMatch(/6 pts until next tier upgrade \(approx\. \+\d+(\.\d)? lb\)/);
    const lbMatch = text.match(/\+(\d+(?:\.\d)?) lb/);
    expect(lbMatch).not.toBeNull();
    expect(Number(lbMatch![1])).toBeGreaterThanOrEqual(0.1);
    unmount();
  });

  it('falls back to points-only when weight is missing', () => {
    const { getLatest, unmount } = renderHint(meaning, null, 5, profile, true);
    expect(getLatest()).toBe('6 pts until next tier upgrade');
    unmount();
  });

  it('returns null when there is no next milestone', () => {
    const { getLatest, unmount } = renderHint(
      { ...meaning, nextMilestone: null, remainingPoints: null },
      80,
      5,
      profile,
      true
    );
    expect(getLatest()).toBeNull();
    unmount();
  });
});
