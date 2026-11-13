/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CrewMemberRadarSheet from '../CrewMemberRadarSheet';

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

vi.mock('../../../hooks/useShellScrollLock', () => ({
  useShellScrollLock: () => undefined,
}));

vi.mock('../../../hooks/useAndroidBackDismiss', () => ({
  useAndroidBackDismiss: () => undefined,
}));

vi.mock('../../../hooks/useLocalProfileBrief', () => ({
  useLocalProfileBrief: () => ({
    initial: 'A',
    displayName: 'Anndrew',
    avatarUrl: undefined,
  }),
}));

vi.mock('../../../i18n/resolveSixAxisChartLabel', () => ({
  resolveSixAxisChartLabel: (_t: unknown, metric: string) => metric,
}));

const member = {
  uid: 'u2',
  displayName: 'Beta',
  ladderScore: 80,
  updatedAt: '2026-01-01T00:00:00.000Z',
  avatarUrl: undefined,
  radarScores: {
    strength: 80,
    explosivePower: 70,
    cardio: 60,
    muscleMass: 50,
    bodyFat: 40,
    gripStrength: 30,
  },
};

describe('CrewMemberRadarSheet dispatch comment bubble', () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('renders the bubble when dispatchComment is non-empty', () => {
    act(() => {
      root.render(
        <CrewMemberRadarSheet
          open
          member={member}
          rank={2}
          guildTag="ARN"
          dispatchComment="肌肌長大了"
          onClose={() => undefined}
        />
      );
    });

    const bubble = document.querySelector('[data-testid="crew-dispatch-comment-bubble"]');
    expect(bubble).not.toBeNull();
    expect(bubble?.textContent).toContain('crew.dispatch.commentBubble.kicker');
    expect(bubble?.textContent).toContain('肌肌長大了');
  });

  it('hides the bubble for list taps without a comment', () => {
    act(() => {
      root.render(
        <CrewMemberRadarSheet
          open
          member={member}
          rank={2}
          guildTag="ARN"
          dispatchComment={null}
          onClose={() => undefined}
        />
      );
    });

    expect(document.querySelector('[data-testid="crew-dispatch-comment-bubble"]')).toBeNull();
  });
});
