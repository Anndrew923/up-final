/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import i18n from '../../../i18n';
import { ROUTES } from '../../../config/routes';
import SpecBadgeUnlockBanner from '../SpecBadgeUnlockBanner';
import { useBadgeToastStore } from '../../../stores/badgeToastStore';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function HistoryProbe() {
  const location = useLocation();
  return <div data-focus-badge-id={(location.state as { focusBadgeId?: string } | null)?.focusBadgeId ?? ''} />;
}

function renderBanner(): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={[ROUTES.home]}>
          <Routes>
            <Route path={ROUTES.home} element={<SpecBadgeUnlockBanner />} />
            <Route path={ROUTES.history} element={<HistoryProbe />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    );
  });
  return { container, root };
}

describe('SpecBadgeUnlockBanner', () => {
  afterEach(() => {
    useBadgeToastStore.setState({ queue: [] });
    document.body.innerHTML = '';
  });

  it('navigates to history with focusBadgeId in route state on click', async () => {
    useBadgeToastStore.setState({ queue: [{ badgeId: 'IGN-01', queuedAt: 1 }] });
    const { container, root } = renderBanner();

    const button = container.querySelector('button');
    expect(button).not.toBeNull();

    act(() => {
      (button as HTMLButtonElement).click();
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    const probe = container.querySelector('[data-focus-badge-id]');
    expect(probe?.getAttribute('data-focus-badge-id')).toBe('IGN-01');

    act(() => root.unmount());
  });
});
