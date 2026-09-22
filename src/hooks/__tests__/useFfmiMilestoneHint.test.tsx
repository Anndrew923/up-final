/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PhysicalProfile } from '../../types/userProfile';
import { useUnitPreferenceStore } from '../../stores/unitPreferenceStore';
import { useFfmiMilestoneHint } from '../useFfmiMilestoneHint';
import type { ScoreMeaningResult } from '../useScoreMeaning';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'ffmi.nextMilestoneHint') {
        return `${String(options?.points)} pts until next tier upgrade`;
      }
      if (key === 'ffmi.nextMilestoneHintWithFatLoss') {
        return `${String(options?.points)} pts until next tier upgrade (maintaining current weight, body fat approx. -${String(options?.delta)}%)`;
      }
      if (key === 'ffmi.nextMilestoneHintWithLeanGain') {
        return `${String(options?.points)} pts until next tier upgrade (fat-loss ceiling reached, lean mass approx. +${String(options?.delta)} ${String(options?.unit)})`;
      }
      if (key === 'units.weight.kg') return 'kg';
      if (key === 'units.weight.lb') return 'lb';
      return key;
    },
  }),
}));

const profile: PhysicalProfile = {
  gender: 'male',
  age: 30,
  heightCm: 175,
  weightKg: 75,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const lightHighTierProfile: PhysicalProfile = {
  gender: 'male',
  age: 30,
  heightCm: 175,
  weightKg: 78,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const meaning: ScoreMeaningResult = {
  title: 'Spec',
  summary: 'Summary',
  nextMilestone: 80,
  remainingPoints: 12,
};

const highTierMeaning: ScoreMeaningResult = {
  title: 'Spec',
  summary: 'Summary',
  nextMilestone: 100,
  remainingPoints: 4,
};

function renderHint(
  scoreMeaning: ScoreMeaningResult | null,
  bodyFatInput: string,
  readyProfile: PhysicalProfile | null,
  profileReady: boolean
): { getLatest: () => string | null; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let latest: string | null = null;

  function Harness() {
    latest = useFfmiMilestoneHint(scoreMeaning, bodyFatInput, readyProfile, profileReady);
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

describe('useFfmiMilestoneHint', () => {
  beforeEach(() => {
    useUnitPreferenceStore.getState().setUnitSystem('metric');
  });

  afterEach(() => {
    useUnitPreferenceStore.getState().setUnitSystem('metric');
  });

  it('returns fatLoss (−%) copy when maintain-weight cut is viable', () => {
    const { getLatest, unmount } = renderHint(meaning, '15', profile, true);
    expect(getLatest()).toMatch(
      /12 pts until next tier upgrade \(maintaining current weight, body fat approx\. -\d+(\.\d)?%\)/
    );
    unmount();
  });

  it('returns leanGain (+kg) copy when fat-loss ceiling forces smart-switch', () => {
    const { getLatest, unmount } = renderHint(highTierMeaning, '4.2', lightHighTierProfile, true);
    expect(getLatest()).toMatch(
      /4 pts until next tier upgrade \(fat-loss ceiling reached, lean mass approx\. \+\d+(\.\d)? kg\)/
    );
    unmount();
  });

  it('returns leanGain (+lb) when imperial units are selected', () => {
    useUnitPreferenceStore.getState().setUnitSystem('imperial');
    const { getLatest, unmount } = renderHint(highTierMeaning, '4.2', lightHighTierProfile, true);
    const text = getLatest() ?? '';
    expect(text).toMatch(
      /4 pts until next tier upgrade \(fat-loss ceiling reached, lean mass approx\. \+\d+(\.\d)? lb\)/
    );
    // Display lb must ceil, not nearest-round, relative to verified kg delta.
    const lbMatch = text.match(/\+(\d+(?:\.\d)?) lb/);
    expect(lbMatch).not.toBeNull();
    const shownLb = Number(lbMatch![1]);
    expect(shownLb).toBeGreaterThanOrEqual(0.1);
    unmount();
  });

  it('falls back to points-only when body fat input is empty', () => {
    const { getLatest, unmount } = renderHint(meaning, '', profile, true);
    expect(getLatest()).toBe('12 pts until next tier upgrade');
    unmount();
  });

  it('returns null when there is no next milestone', () => {
    const { getLatest, unmount } = renderHint(
      { ...meaning, nextMilestone: null, remainingPoints: null },
      '15',
      profile,
      true
    );
    expect(getLatest()).toBeNull();
    unmount();
  });
});
