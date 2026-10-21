/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BottomNav from '../BottomNav';
import i18n from '../../../i18n';
import { I18nextProvider } from 'react-i18next';

let hasUnseen = true;

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../../../hooks/useHistorySpecBadgeNotification', () => ({
  useHistorySpecBadgeNotification: () => ({ hasUnseenSpecBadge: hasUnseen }),
}));

vi.mock('../../../stores/uiInteractionStore', () => ({
  useShellInteractionBlocked: () => false,
  useUiInteractionStore: (selector: (s: any) => any) =>
    selector({
      isHomeResonanceBlocking: false,
      isBootSequenceBlocking: false,
      bootSequencePhase: 0,
      bootSequenceVariant: 'none',
    }),
}));

afterEach(() => {
  hasUnseen = true;
  document.body.innerHTML = '';
});

function renderWithPath(path: string): { container: HTMLDivElement; unmount: () => void } {
  const router = createMemoryRouter([{ path: '*', element: <BottomNav /> }], {
    initialEntries: [path],
  });
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);

  act(() => {
    root.render(
      <I18nextProvider i18n={i18n}>
        <RouterProvider router={router} />
      </I18nextProvider>
    );
  });

  return {
    container,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('BottomNav chrome shell', () => {
  it('uses an elastic outer shell with a fixed h-16 row and no short glass overlay', () => {
    const { container, unmount } = renderWithPath('/');
    const nav = container.querySelector('nav');
    expect(nav).not.toBeNull();
    expect(nav?.className).toContain('fixed');
    expect(nav?.className).toContain('inset-x-0');
    expect(nav?.className).toContain('bottom-0');
    expect(nav?.className).toContain('z-50');
    expect(nav?.className).toContain('w-full');
    expect(nav?.className).toContain('bg-slate-950/95');
    expect(nav?.className).toContain('backdrop-blur-lg');
    expect(nav?.className).not.toContain('overflow-hidden');
    expect(nav?.className).not.toMatch(/h-\[calc/);
    expect(nav?.childElementCount).toBe(1);

    const row = nav?.querySelector(':scope > div');
    expect(row?.className).toContain('h-16');
    expect(row?.className).toContain('items-center');
    expect(row?.className).toContain('w-full');
    expect(row?.className).toContain('px-2');

    const hexTab = container.querySelector('a[href="/skill-tree"]');
    expect(hexTab?.className).toContain('-translate-y-4');
    unmount();
  });
});

describe('BottomNav spec badge red dot', () => {
  it('shows dot on History tab and augments aria-label when there is an unseen spec badge', () => {
    hasUnseen = true;
    const { container, unmount } = renderWithPath('/user-info');

    expect(container.querySelector('.bg-rose-500')).not.toBeNull();
    const historyLink = container.querySelector('a[href="/history"]');
    expect(historyLink?.getAttribute('aria-label')).toContain('New spec badge unlocked');
    unmount();
  });

  it('hides dot and keeps the plain history label on /history', () => {
    hasUnseen = true;
    const { container, unmount } = renderWithPath('/history');

    expect(container.querySelector('.bg-rose-500')).toBeNull();
    const historyLink = container.querySelector('a[href="/history"]');
    expect(historyLink?.getAttribute('aria-label')).toBe('LOGS');
    unmount();
  });
});

