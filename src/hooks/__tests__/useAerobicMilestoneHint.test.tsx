/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import type { PhysicalProfile } from '../../types/userProfile';
import { useAerobicMilestoneHint } from '../useAerobicMilestoneHint';
import type { ScoreMeaningResult } from '../useScoreMeaning';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'cardio.nextMilestoneHint') {
        return `${String(options?.points)} pts until next tier upgrade`;
      }
      if (key === 'cardio.nextMilestoneHintWithRaw5km') {
        return `${String(options?.points)} pts until next tier upgrade (5km approx. ${String(options?.timeString)} faster)`;
      }
      if (key === 'cardio.nextMilestoneHintWithRawCooper') {
        return `${String(options?.points)} pts until next tier upgrade (Cooper approx. +${String(options?.delta)} m)`;
      }
      if (key === 'cardio.deltaTimeSecondsOnly') {
        return `${String(options?.sec)}s`;
      }
      if (key === 'cardio.deltaTimeMinutesOnly') {
        return `${String(options?.min)}m`;
      }
      if (key === 'cardio.deltaTimeMinutesSeconds') {
        return `${String(options?.min)}m ${String(options?.sec)}s`;
      }
      return key;
    },
  }),
}));

const maleProfile: PhysicalProfile = {
  gender: 'male',
  age: 28,
  heightCm: 178,
  weightKg: 80,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const femaleProfile: PhysicalProfile = {
  ...maleProfile,
  gender: 'female',
};

const meaning: ScoreMeaningResult = {
  title: 'Spec',
  summary: 'Summary',
  bandId: 'TIER_70',
  decadeKey: '70',
  populationClass: '進階訓練者',
  nextMilestone: 80,
  remainingPoints: 10,
};

function renderHint(params: {
  scoreMeaning: ScoreMeaningResult | null;
  tab: 'cooper' | '5km';
  distanceInput?: string;
  minutes?: string;
  seconds?: string;
  profile: PhysicalProfile | null;
  profileReady?: boolean;
}): { getLatest: () => string | null; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let latest: string | null = null;

  function Harness() {
    latest = useAerobicMilestoneHint(
      params.scoreMeaning,
      params.tab,
      params.distanceInput ?? '',
      params.minutes ?? '',
      params.seconds ?? '',
      params.profile,
      params.profileReady ?? true
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

describe('useAerobicMilestoneHint', () => {
  it('returns Δmeters raw gap beside points on Cooper tab', () => {
    // WHY: 1900 m male 20-29 ≈ 70 pts — next decade gate is 80 (+300 m).
    const { getLatest, unmount } = renderHint({
      scoreMeaning: meaning,
      tab: 'cooper',
      distanceInput: '1900',
      profile: maleProfile,
    });
    expect(getLatest()).toMatch(
      /10 pts until next tier upgrade \(Cooper approx\. \+\d+ m\)/
    );
    unmount();
  });

  it('falls back to points-only on Cooper when profile incomplete', () => {
    const { getLatest, unmount } = renderHint({
      scoreMeaning: meaning,
      tab: 'cooper',
      distanceInput: '1900',
      profile: maleProfile,
      profileReady: false,
    });
    expect(getLatest()).toBe('10 pts until next tier upgrade');
    unmount();
  });

  it('returns Δtime raw gap beside points on 5km tab', () => {
    // WHY: 26:00 male ≈ 76 pts — next decade gate is 80 (25:00 sits exactly on 80).
    const { getLatest, unmount } = renderHint({
      scoreMeaning: { ...meaning, remainingPoints: 4 },
      tab: '5km',
      minutes: '26',
      seconds: '0',
      profile: maleProfile,
    });
    expect(getLatest()).toMatch(
      /4 pts until next tier upgrade \(5km approx\. .+ faster\)/
    );
    unmount();
  });

  it('uses profile gender without requiring a complete-profile gate on 5km', () => {
    const { getLatest, unmount } = renderHint({
      scoreMeaning: { ...meaning, remainingPoints: 4 },
      tab: '5km',
      minutes: '30',
      seconds: '0',
      profile: femaleProfile,
      profileReady: false,
    });
    const text = getLatest();
    expect(text).toMatch(/4 pts until next tier upgrade/);
    expect(text).not.toBeNull();
    unmount();
  });

  it('falls back to points-only when 5km time is invalid', () => {
    const { getLatest, unmount } = renderHint({
      scoreMeaning: { ...meaning, remainingPoints: 4 },
      tab: '5km',
      profile: maleProfile,
    });
    expect(getLatest()).toBe('4 pts until next tier upgrade');
    unmount();
  });

  it('defaults gender to male when profile is null on 5km', () => {
    const { getLatest, unmount } = renderHint({
      scoreMeaning: { ...meaning, remainingPoints: 4 },
      tab: '5km',
      minutes: '26',
      seconds: '0',
      profile: null,
    });
    expect(getLatest()).toMatch(
      /4 pts until next tier upgrade \(5km approx\. .+ faster\)/
    );
    unmount();
  });

  it('returns null when no next milestone', () => {
    const { getLatest, unmount } = renderHint({
      scoreMeaning: { ...meaning, nextMilestone: null, remainingPoints: null },
      tab: 'cooper',
      distanceInput: '1900',
      profile: maleProfile,
    });
    expect(getLatest()).toBeNull();
    unmount();
  });
});
