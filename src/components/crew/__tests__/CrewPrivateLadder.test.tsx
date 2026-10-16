/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CrewPrivateLadder from '../CrewPrivateLadder';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../ProAvatarRing', () => ({
  default: () => <div data-testid="avatar" />,
}));

vi.mock('../../radar/HexRadarChart', () => ({
  default: () => <div data-testid="hex-radar" />,
}));

vi.mock('../../../hooks/useMergedScoresFromLocalStores', () => ({
  useMergedScoresFromLocalStores: () => ({
    strength: 50,
    explosivePower: 50,
    cardio: 50,
    muscleMass: 50,
    bodyFat: 50,
    gripStrength: 50,
  }),
}));

vi.mock('../../../i18n/resolveSixAxisChartLabel', () => ({
  resolveSixAxisChartLabel: (_t: unknown, metric: string) => metric,
}));

vi.mock('../../../logic/core/crewFloatingYouBar', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../../logic/core/crewFloatingYouBar')>();
  return {
    ...actual,
    shouldShowCrewFloatingYouBar: () => true,
  };
});

class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(callback: IntersectionObserverCallback) {
    // Immediately report not intersecting so sticky bar path stays active under mock.
    callback(
      [{ isIntersecting: false } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
}

describe('CrewPrivateLadder', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it('renders ranked rows with #1 highlight copy', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root.render(
        <CrewPrivateLadder
          authUid="u2"
          members={[
            {
              uid: 'u1',
              displayName: 'Alpha',
              ladderScore: 99,
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
            {
              uid: 'u2',
              displayName: 'Beta',
              ladderScore: 50,
              updatedAt: '2026-01-02T00:00:00.000Z',
            },
          ]}
        />
      );
    });

    expect(container.textContent).toContain('crew.ladder.title');
    expect(container.textContent).toContain('✦ #1');
    expect(container.textContent).toContain('#2');
    expect(container.textContent).toContain('Alpha');
    expect(container.textContent).toContain('Beta');
    expect(container.textContent).toContain('crew.ladder.you');
    expect(container.textContent).toContain('crew.ladder.dimOverall');
    expect(document.body.querySelector('[data-testid="crew-floating-you-bar"]')).toBeTruthy();
  });

  it('re-ranks by strength tab without network', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root.render(
        <CrewPrivateLadder
          authUid={null}
          members={[
            {
              uid: 'low',
              displayName: 'LowStr',
              ladderScore: 99,
              radarScores: {
                strength: 10,
                explosivePower: 1,
                cardio: 1,
                muscleMass: 1,
                bodyFat: 1,
                gripStrength: 1,
              },
              updatedAt: 't0',
            },
            {
              uid: 'high',
              displayName: 'HighStr',
              ladderScore: 40,
              radarScores: {
                strength: 90,
                explosivePower: 1,
                cardio: 1,
                muscleMass: 1,
                bodyFat: 1,
                gripStrength: 1,
              },
              updatedAt: 't0',
            },
          ]}
        />
      );
    });

    const strengthChip = Array.from(container.querySelectorAll('[role="tab"]')).find((el) =>
      el.textContent?.includes('strength')
    );
    expect(strengthChip).toBeTruthy();
    act(() => {
      strengthChip!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const rows = container.querySelectorAll('li button');
    expect(rows[0]?.textContent).toContain('HighStr');
    expect(rows[0]?.textContent).toContain('90.00');
    expect(rows[1]?.textContent).toContain('LowStr');
  });

  it('shows empty copy when no members', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root.render(<CrewPrivateLadder authUid={null} members={[]} />);
    });

    expect(container.textContent).toContain('crew.ladder.empty');
  });
});
