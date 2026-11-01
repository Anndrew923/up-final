/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CrewFloatingYouBar from '../CrewFloatingYouBar';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('CrewFloatingYouBar', () => {
  let container: HTMLDivElement;
  let root: Root;

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

  it('falls back to initial when avatar image errors', () => {
    act(() => {
      root.render(
        <CrewFloatingYouBar
          myRank={5}
          myScoreLabel="60.12"
          displayName="Anndrew"
          avatarUrl="https://example.com/broken.jpg"
          onJumpToMyRow={() => undefined}
        />
      );
    });

    const img = container.querySelector('img');
    expect(img).not.toBeNull();

    act(() => {
      img?.dispatchEvent(new Event('error', { bubbles: true }));
    });

    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('A');
    expect(container.textContent).toContain('Anndrew');
  });

  it('uses full-bleed inset and nowrap mono score without a radar child', () => {
    act(() => {
      root.render(
        <CrewFloatingYouBar
          myRank={5}
          myScoreLabel="60.12"
          displayName="Anndrew"
          onJumpToMyRow={() => undefined}
        />
      );
    });

    const bar = container.querySelector('[data-testid="crew-floating-you-bar"]');
    expect(bar).not.toBeNull();
    expect(bar?.textContent).not.toContain('crew.ladder.floatingYou.subline');
    expect(bar?.className).toContain('inset-x-0');
    expect(bar?.className).not.toContain('inset-x-3');
    expect(bar?.querySelector('[data-testid="hex-radar"]')).toBeNull();

    const score = Array.from(bar?.querySelectorAll('span') ?? []).find(
      (el) => el.children.length === 0 && el.textContent === '60.12'
    );
    expect(score?.className).toContain('whitespace-nowrap');
    expect(score?.className).toContain('font-mono');
    expect(container.querySelector('clipPath')).not.toBeNull();
  });
});
