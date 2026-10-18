/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveRadarPkScanMs } from '../../../logic/core/radarPkClashMotion';
import LadderUserPreviewModal from '../LadderUserPreviewModal';

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

vi.mock('../../../hooks/useShellScrollLock', () => ({
  useShellScrollLock: () => undefined,
}));

vi.mock('../../../hooks/useAndroidBackDismiss', () => ({
  useAndroidBackDismiss: () => undefined,
}));

vi.mock('../../../hooks/usePullDownDismiss', () => ({
  usePullDownDismiss: () => ({
    offset: 0,
    dragging: false,
    handleProps: {},
  }),
}));

vi.mock('../../../hooks/useCurrentUserIsAdmin', () => ({
  useCurrentUserIsAdmin: () => ({ isAdmin: false }),
}));

vi.mock('../../../hooks/useMergedScoresFromLocalStores', () => ({
  useMergedScoresFromLocalStores: () => ({
    strength: 60,
    explosivePower: 60,
    cardio: 60,
    muscleMass: 60,
    bodyFat: 60,
    gripStrength: 60,
  }),
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



vi.mock('../../../stores/ladderBlockStore', () => ({
  useLadderBlockStore: (sel: (s: { block: () => void }) => unknown) =>
    sel({ block: vi.fn() }),
}));

vi.mock('../../radar/HexRadarChart', () => ({
  default: (props: Record<string, unknown>) => {
    hexPropsSpy(props);
    return <div data-testid="hex-radar" />;
  },
}));

vi.mock('../../ProAvatarRing', () => ({
  default: () => <div data-testid="avatar" />,
}));

vi.mock('../../../i18n/resolveSixAxisChartLabel', () => ({
  resolveSixAxisChartLabel: (_t: unknown, metric: string) => metric,
}));

const previewUser = {
  uid: 'other',
  displayName: 'Rival',
  isAnonymousInLadder: false,
  radarScores: {
    strength: 80,
    explosivePower: 70,
    cardio: 60,
    muscleMass: 50,
    bodyFat: 40,
    gripStrength: 30,
  },
  radarAxisCount: 6,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('LadderUserPreviewModal opt-in PK', () => {
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


  it('defaults to ritual and enables quiet PK via scan then clash for other players', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root.render(
        <LadderUserPreviewModal
          open
          loading={false}
          error={false}
          user={previewUser}
          targetUid="other"
          viewerUid="me"
          onClose={() => undefined}
        />
      );
    });

    let last = hexPropsSpy.mock.calls.at(-1)?.[0] as {
      presentation?: string;
      comparisonPoints?: unknown;
    };
    expect(last.presentation).toBe('ritual');
    expect(last.comparisonPoints).toBeUndefined();
    expect(document.body.querySelector('[data-testid="radar-pk-toggle"]')).toBeTruthy();

    const toggle = document.body.querySelector(
      '[data-testid="radar-pk-toggle"]'
    ) as HTMLButtonElement;
    act(() => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(document.body.querySelector('[data-testid="radar-pk-scan-overlay"]')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(resolveRadarPkScanMs(false));
    });

    last = hexPropsSpy.mock.calls.at(-1)?.[0] as {
      presentation?: string;
      comparisonPoints?: unknown[] | undefined;
    };
    expect(last.presentation).toBe('quiet');
    expect(Array.isArray(last.comparisonPoints)).toBe(true);
    expect((last.comparisonPoints as unknown[]).length).toBe(6);
    expect(document.body.querySelector('[data-testid="radar-pk-scan-overlay"]')).toBeNull();
    const legend = document.body.querySelector(
      '[data-testid="ladder-radar-compare-legend"]'
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
    viewerBriefState.displayName = '';
    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root.render(
        <LadderUserPreviewModal
          open
          loading={false}
          error={false}
          user={previewUser}
          targetUid="other"
          viewerUid="me"
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
      '[data-testid="ladder-radar-compare-legend"]'
    );
    expect(legend?.textContent).toContain(
      'ladder.userPreview.battleBanner.viewerFallback'
    );
  });

  it('hides PK toggle when target has no positive radar axes', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root.render(
        <LadderUserPreviewModal
          open
          loading={false}
          error={false}
          user={{
            ...previewUser,
            radarScores: {},
            radarAxisCount: 0,
          }}
          targetUid="other"
          viewerUid="me"
          onClose={() => undefined}
        />
      );
    });

    expect(document.body.querySelector('[data-testid="radar-pk-toggle"]')).toBeNull();
    const last = hexPropsSpy.mock.calls.at(-1)?.[0] as {
      presentation?: string;
      comparisonPoints?: unknown;
    };
    expect(last.presentation).toBe('ritual');
    expect(last.comparisonPoints).toBeUndefined();
  });

  it('hides PK toggle when viewing self', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root.render(
        <LadderUserPreviewModal
          open
          loading={false}
          error={false}
          user={{ ...previewUser, uid: 'me', displayName: 'Me' }}
          targetUid="me"
          viewerUid="me"
          onClose={() => undefined}
        />
      );
    });

    expect(document.body.querySelector('[data-testid="radar-pk-toggle"]')).toBeNull();
    const last = hexPropsSpy.mock.calls.at(-1)?.[0] as { presentation?: string };
    expect(last.presentation).toBe('ritual');
  });
});
