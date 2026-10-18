/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveRadarPkScanMs } from '../../../logic/core/radarPkClashMotion';
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

const { viewerBriefState } = vi.hoisted(() => ({
  viewerBriefState: {
    initial: 'A',
    displayName: 'Anndrew',
    avatarUrl: undefined as string | undefined,
  },
}));

vi.mock('../../../hooks/useLocalProfileBrief', () => ({
  useLocalProfileBrief: () => viewerBriefState,
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

const localCompare = {
  strength: 55,
  explosivePower: 55,
  cardio: 55,
  muscleMass: 55,
  bodyFat: 55,
  gripStrength: 55,
};

describe('CrewMemberRadarSheet opt-in PK', () => {
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    viewerBriefState.displayName = 'Anndrew';
    viewerBriefState.initial = 'A';
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    document.body.innerHTML = '';
    hexPropsSpy.mockClear();
    vi.useRealTimers();
  });


  it('defaults to ritual admiration without comparison overlay', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root.render(
        <CrewMemberRadarSheet
          open
          guildTag="ARN"
          rank={2}
          isSelf={false}
          member={{
            uid: 'other',
            displayName: 'Rival',
            ladderScore: 66,
            radarScores: memberRadar,
            updatedAt: '2026-01-01T00:00:00.000Z',
          }}
          comparisonScores={localCompare}
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
    expect(document.body.querySelector('[data-testid="radar-pk-toggle"]')).toBeTruthy();
    expect(document.body.querySelector('[data-testid="crew-radar-compare-legend"]')).toBeNull();
  });

  it('scans then switches to quiet PK clash after toggle', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root.render(
        <CrewMemberRadarSheet
          open
          guildTag="ARN"
          rank={2}
          isSelf={false}
          member={{
            uid: 'other',
            displayName: 'Rival',
            ladderScore: 66,
            radarScores: memberRadar,
            updatedAt: '2026-01-01T00:00:00.000Z',
          }}
          comparisonScores={localCompare}
          onClose={() => undefined}
        />
      );
    });

    const toggle = document.body.querySelector(
      '[data-testid="radar-pk-toggle"]'
    ) as HTMLButtonElement;
    act(() => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(document.body.querySelector('[data-testid="radar-pk-scan-overlay"]')).toBeTruthy();
    expect(toggle.getAttribute('data-pk-scanning')).toBe('true');

    act(() => {
      vi.advanceTimersByTime(resolveRadarPkScanMs(false));
    });

    const last = hexPropsSpy.mock.calls.at(-1)?.[0] as {
      presentation?: string;
      comparisonPoints?: unknown[];
    };
    expect(last.presentation).toBe('quiet');
    expect(Array.isArray(last.comparisonPoints)).toBe(true);
    expect(last.comparisonPoints?.length).toBe(6);
    expect(document.body.querySelector('[data-testid="radar-pk-scan-overlay"]')).toBeNull();
    const legend = document.body.querySelector(
      '[data-testid="crew-radar-compare-legend"]'
    );
    expect(legend).toBeTruthy();
    expect(legend?.textContent).toContain('Anndrew');
    expect(legend?.textContent).not.toMatch(/\bYou\b|你/);
    expect(document.body.querySelector('[data-testid="radar-pk-battle-banner"]')).toBeTruthy();
    const badge = document.body.querySelector(
      '[data-testid="radar-pk-battle-badge"]'
    ) as HTMLElement;
    expect(badge).toBeTruthy();
    expect(badge.getAttribute('data-badge-status')).toBeTruthy();
    expect(badge.querySelector('svg')).toBeTruthy();
    expect(badge.textContent).not.toMatch(/[🔥⚡💥]/u);
  });

  it('falls back to i18n Me label when viewer has no displayName', () => {

    viewerBriefState.displayName = '   ';
    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root.render(
        <CrewMemberRadarSheet
          open
          guildTag="ARN"
          rank={2}
          isSelf={false}
          member={{
            uid: 'other',
            displayName: 'Rival',
            ladderScore: 66,
            radarScores: memberRadar,
            updatedAt: '2026-01-01T00:00:00.000Z',
          }}
          comparisonScores={localCompare}
          onClose={() => undefined}
        />
      );
    });

    const toggle = document.body.querySelector(
      '[data-testid="radar-pk-toggle"]'
    ) as HTMLButtonElement;
    act(() => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    act(() => {
      vi.advanceTimersByTime(resolveRadarPkScanMs(false));
    });

    const legend = document.body.querySelector(
      '[data-testid="crew-radar-compare-legend"]'
    );
    expect(legend?.textContent).toContain('crew.ladder.battleBanner.viewerFallback');
  });

  it('hides PK toggle for self view', () => {

    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root.render(
        <CrewMemberRadarSheet
          open
          guildTag="ARN"
          rank={1}
          isSelf
          member={{
            uid: 'me',
            displayName: 'Me',
            ladderScore: 90,
            radarScores: memberRadar,
            updatedAt: '2026-01-01T00:00:00.000Z',
          }}
          comparisonScores={localCompare}
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
    expect(document.body.querySelector('[data-testid="radar-pk-toggle"]')).toBeNull();
  });
});
