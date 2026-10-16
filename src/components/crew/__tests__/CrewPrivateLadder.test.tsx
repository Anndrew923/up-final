/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

describe('CrewPrivateLadder', () => {
  let container: HTMLDivElement;
  let root: Root;

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
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
