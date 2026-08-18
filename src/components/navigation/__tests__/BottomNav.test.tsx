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

