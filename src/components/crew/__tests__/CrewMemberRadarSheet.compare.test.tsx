/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CrewMemberRadarSheet from '../CrewMemberRadarSheet';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const hexPropsSpy = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { name?: string }) =>
      opts?.name ? `${key}:${opts.name}` : key,
  }),
}));

vi.mock('../../ProAvatarRing', () => ({
  default: () => <div data-testid="avatar" />,
}));

vi.mock('../../radar/HexRadarChart', () => ({
  default: (props: Record<string, unknown>) => {
    hexPropsSpy(props);
    return <div data-testid="hex-radar" />;
  },
}));

vi.mock('../../../hooks/useShellScrollLock', () => ({
  useShellScrollLock: () => undefined,
}));

vi.mock('../../../hooks/useAndroidBackDismiss', () => ({
  useAndroidBackDismiss: () => undefined,
}));

vi.mock('../../../i18n/resolveSixAxisChartLabel', () => ({
  resolveSixAxisChartLabel: (_t: unknown, metric: string) => metric,
}));

const memberRadar = {
  strength: 80,
  explosivePower: 70,
  cardio: 60,
  muscleMass: 50,
  bodyFat: 40,
  gripStrength: 30,
};

describe('CrewMemberRadarSheet compare-with-me', () => {
  let root: Root;

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    document.body.innerHTML = '';
    hexPropsSpy.mockClear();
  });

  it('passes comparisonPoints when viewing another member with local scores', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root.render(
        <CrewMemberRadarSheet
          open
          guildTag="ARN"
          rank={2}
          member={{
            uid: 'other',
            displayName: 'Rival',
            ladderScore: 66,
            radarScores: memberRadar,
            updatedAt: '2026-01-01T00:00:00.000Z',
          }}
          comparisonScores={{
            strength: 55,
            explosivePower: 55,
            cardio: 55,
            muscleMass: 55,
            bodyFat: 55,
            gripStrength: 55,
          }}
          onClose={() => undefined}
        />
      );
    });

    expect(hexPropsSpy).toHaveBeenCalled();
    const last = hexPropsSpy.mock.calls.at(-1)?.[0] as {
      comparisonPoints?: unknown[];
      presentation?: string;
    };
    expect(last.presentation).toBe('quiet');
    expect(Array.isArray(last.comparisonPoints)).toBe(true);
    expect(last.comparisonPoints?.length).toBe(6);
    expect(document.body.textContent).toContain('crew.ladder.compareLegendYou');
    expect(document.body.querySelector('[data-testid="crew-radar-compare-legend"]')).toBeTruthy();
  });

  it('keeps single-layer when comparisonScores omitted (self view)', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root.render(
        <CrewMemberRadarSheet
          open
          guildTag="ARN"
          rank={1}
          member={{
            uid: 'me',
            displayName: 'Me',
            ladderScore: 90,
            radarScores: memberRadar,
            updatedAt: '2026-01-01T00:00:00.000Z',
          }}
          comparisonScores={null}
          onClose={() => undefined}
        />
      );
    });

    const last = hexPropsSpy.mock.calls.at(-1)?.[0] as {
      comparisonPoints?: unknown;
      presentation?: string;
    };
    expect(last.presentation).toBe('ritual');
    expect(last.comparisonPoints).toBeUndefined();
    expect(document.body.querySelector('[data-testid="crew-radar-compare-legend"]')).toBeNull();
  });

  it('uses ritual when viewing another member without local compare baseline', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root.render(
        <CrewMemberRadarSheet
          open
          guildTag="ARN"
          rank={3}
          member={{
            uid: 'other',
            displayName: 'Rival',
            ladderScore: 66,
            radarScores: memberRadar,
            updatedAt: '2026-01-01T00:00:00.000Z',
          }}
          comparisonScores={null}
          onClose={() => undefined}
        />
      );
    });

    const last = hexPropsSpy.mock.calls.at(-1)?.[0] as {
      presentation?: string;
      comparisonPoints?: unknown;
    };
    expect(last.presentation).toBe('ritual');
    expect(last.comparisonPoints).toBeUndefined();
  });
});
