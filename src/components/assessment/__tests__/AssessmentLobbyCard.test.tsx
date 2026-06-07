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
  it('renders navigable link with title and status bar', () => {
    const { container, unmount } = renderCard();
    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toContain('strength');
    expect(link?.getAttribute('aria-label')).toBe('Strength test');
    expect(container.textContent).toContain('Strength test');
    expect(container.querySelector('span[aria-hidden]')).not.toBeNull();
    unmount();
  });

  it('applies per-axis aurora gradient and neon border from shared tokens', () => {
    const { container, unmount } = renderCard();
    const link = container.querySelector('a') as HTMLAnchorElement;
    expect(link.style.backgroundImage).toContain('linear-gradient');
    expect(link.style.borderColor).toMatch(/^rgba?\(/);
    expect(link.style.getPropertyValue('--lobby-border-hover')).toMatch(/^rgba?\(/);
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

  it('splits localized title into main and subtitle tiers', () => {
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
                  title="五項力量（整車馬力 // HP）"
                />
              }
            />
          </Routes>
        </MemoryRouter>
      );
    });
    expect(container.textContent).toContain('五項力量');
    expect(container.textContent).toContain('整車馬力 // HP');
    expect(container.querySelector('h2')?.textContent).toBe('五項力量');
    expect(container.querySelector('p.text-\\[11px\\]')?.textContent).toBe('整車馬力 // HP');
    act(() => {
      root.unmount();
    });
    container.remove();
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
