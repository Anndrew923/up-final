/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ROUTES } from '../../../config/routes';
import HudBackControl from '../HudBackControl';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const navigateMock = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => (key === 'back' ? 'BACK' : key),
  }),
}));

vi.mock('../../../stores/uiInteractionStore', () => ({
  useShellInteractionBlocked: () => false,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

function renderAt(path: string): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="*" element={<HudBackControl />} />
        </Routes>
      </MemoryRouter>
    );
  });
  return { container, root };
}

describe('HudBackControl', () => {
  afterEach(() => {
    navigateMock.mockReset();
    document.body.innerHTML = '';
  });

  it('hides on primary tab routes', () => {
    const { container, root } = renderAt(ROUTES.home);
    expect(container.querySelector('button')).toBeNull();
    act(() => root.unmount());
  });

  it('shows on assessment subpages and navigates history when available', () => {
    const historySpy = vi.spyOn(window.history, 'state', 'get').mockReturnValue({ idx: 2 });
    const { container, root } = renderAt(ROUTES.strength);
    const button = container.querySelector('button');
    expect(button?.textContent).toBe('BACK');
    act(() => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(navigateMock).toHaveBeenCalledWith(-1);
    historySpy.mockRestore();
    act(() => root.unmount());
  });

  it('uses parent fallback when history cannot pop', () => {
    const historySpy = vi.spyOn(window.history, 'state', 'get').mockReturnValue({ idx: 0 });
    const { container, root } = renderAt(ROUTES.strength);
    const button = container.querySelector('button');
    act(() => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(navigateMock).toHaveBeenCalledWith(ROUTES.assessment, { replace: true });
    historySpy.mockRestore();
    act(() => root.unmount());
  });
});
