/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PhysicalProfile } from '../../types/userProfile';
import { useUnitPreferenceStore } from '../../stores/unitPreferenceStore';
import { useMuscleMilestoneHint } from '../useMuscleMilestoneHint';
import type { ScoreMeaningResult } from '../useScoreMeaning';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'muscle.nextMilestoneHint') {
        return `${String(options?.points)} pts until next tier upgrade`;
      }
      if (key === 'muscle.nextMilestoneHintWithRaw') {
        return `${String(options?.points)} pts until next tier upgrade (maintaining current weight, skeletal muscle approx. +${String(options?.delta)} ${String(options?.unit)})`;
      }
      if (key === 'units.weight.kg') return 'kg';
      if (key === 'units.weight.lb') return 'lb';
      return key;
    },
  }),
}));

const profile: PhysicalProfile = {
  gender: 'male',
  age: 25,
  heightCm: 175,
  weightKg: 80,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const meaning: ScoreMeaningResult = {
  title: 'Spec',
  summary: 'Summary',
  bandId: 'TIER_70',
  decadeKey: '70',
  populationClass: '進階訓練者',
  nextMilestone: 80,
  remainingPoints: 5,
};

function renderHint(
  scoreMeaning: ScoreMeaningResult | null,
  smmInput: string,
  readyProfile: PhysicalProfile | null,
  profileReady: boolean
): { getLatest: () => string | null; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let latest: string | null = null;

  function Harness() {
    latest = useMuscleMilestoneHint(scoreMeaning, smmInput, readyProfile, profileReady);
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

describe('useMuscleMilestoneHint', () => {
  beforeEach(() => {
    useUnitPreferenceStore.getState().setUnitSystem('metric');
  });

  afterEach(() => {
    useUnitPreferenceStore.getState().setUnitSystem('metric');
  });

  it('returns ΔSMM raw gap beside points when profile + SMM resolve', () => {
    const { getLatest, unmount } = renderHint(meaning, '40', profile, true);
    expect(getLatest()).toMatch(
      /5 pts until next tier upgrade \(maintaining current weight, skeletal muscle approx\. \+\d+(\.\d)? kg\)/
    );
    unmount();
  });

  it('ceil1Display imperial lb so display cannot under-promise verified kg', () => {
    useUnitPreferenceStore.getState().setUnitSystem('imperial');
    const { getLatest, unmount } = renderHint(meaning, '40', profile, true);
    const text = getLatest() ?? '';
    expect(text).toMatch(
      /5 pts until next tier upgrade \(maintaining current weight, skeletal muscle approx\. \+\d+(\.\d)? lb\)/
    );
    const lbMatch = text.match(/\+(\d+(?:\.\d)?) lb/);
    expect(lbMatch).not.toBeNull();
    expect(Number(lbMatch![1])).toBeGreaterThanOrEqual(0.1);
    unmount();
  });

  it('falls back to points-only when SMM input is empty', () => {
    const { getLatest, unmount } = renderHint(meaning, '', profile, true);
    expect(getLatest()).toBe('5 pts until next tier upgrade');
    unmount();
  });

  it('returns null when there is no next milestone', () => {
    const { getLatest, unmount } = renderHint(
      { ...meaning, nextMilestone: null, remainingPoints: null },
      '40',
      profile,
      true
    );
    expect(getLatest()).toBeNull();
    unmount();
  });
});
