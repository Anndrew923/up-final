/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ROUTES } from '../../../config/routes';
import { AssessmentLobbyCard } from '../AssessmentLobbyCard';

const mockNavigate = vi.fn();

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderCard(): { container: HTMLDivElement; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/assessment']}>
        <Routes>
          <Route
            path="/assessment"
            element={
              <AssessmentLobbyCard
                cardKey="strength"
                to={ROUTES.strength}
                kicker="STRENGTH"
                title="Strength test"
              />
            }
          />
        </Routes>
      </MemoryRouter>
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

afterEach(() => {
  mockNavigate.mockReset();
});

describe('AssessmentLobbyCard', () => {
  it('renders navigable link with kicker, title, and status bar', () => {
    const { container, unmount } = renderCard();
    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toContain('strength');
    expect(link?.getAttribute('aria-label')).toBe('Strength test');
    expect(container.textContent).toContain('STRENGTH');
    expect(container.textContent).toContain('Strength test');
    expect(container.querySelector('span[aria-hidden]')).not.toBeNull();
    unmount();
  });

  it('prevents native click for plain left-button taps', () => {
    const { container, unmount } = renderCard();
    const link = container.querySelector('a') as HTMLAnchorElement;
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    act(() => {
      link.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
    unmount();
  });

  it('allows modified clicks for open-in-new-tab semantics', () => {
    const { container, unmount } = renderCard();
    const link = container.querySelector('a') as HTMLAnchorElement;
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 0,
      ctrlKey: true,
    });
    act(() => {
      link.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(false);
    unmount();
  });

  it('navigates on keyboard activation', () => {
    const { container, unmount } = renderCard();
    const link = container.querySelector('a') as HTMLAnchorElement;
    act(() => {
      link.dispatchEvent(
        new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
      );
    });
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.strength);
    unmount();
  });
});
