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

function renderCard(
  props?: Partial<{
    size: 'hero' | 'standard' | 'capsule';
    title: string;
    glanceLabel: string;
    glanceFilled: boolean;
  }>
): { container: HTMLDivElement; unmount: () => void } {
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
                title={props?.title ?? 'Strength test'}
                glanceLabel={props?.glanceLabel ?? 'Pending'}
                glanceFilled={props?.glanceFilled ?? false}
                size={props?.size}
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
  it('renders navigable link with title, glance rail, and ambient glow', () => {
    const { container, unmount } = renderCard({
      glanceLabel: '81.57',
      glanceFilled: true,
    });
    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(link?.className).toContain('ui-lobby-card');
    expect(link?.className).toContain('justify-between');
    expect(link?.getAttribute('href')).toContain('strength');
    expect(link?.getAttribute('aria-label')).toBe('Strength test, 81.57');
    expect(container.textContent).toContain('Strength test');
    expect(container.textContent).toContain('81.57');
    expect(container.textContent).not.toContain('HP');
    expect(container.textContent).toContain('›');
    expect(container.querySelector('.ui-lobby-card__ambient')).not.toBeNull();
    expect(container.querySelector('.ui-lobby-card__beam-wrap')).toBeNull();
    unmount();
  });

  it('tones down unset glance labels', () => {
    const { container, unmount } = renderCard({
      glanceLabel: 'Pending',
      glanceFilled: false,
    });
    const glance = Array.from(container.querySelectorAll('span')).find(
      (el) => el.textContent === 'Pending'
    );
    expect(glance?.className).toContain('text-zinc-600');
    expect(glance?.className).toContain('text-xs');
    expect(glance?.className).toContain('font-mono');
    expect(glance?.className).not.toContain('text-amber-400');
    unmount();
  });

  it('elevates filled glance as amber mono value (hero bolder)', () => {
    const { container, unmount } = renderCard({
      glanceLabel: '81.57',
      glanceFilled: true,
      size: 'hero',
    });
    const glance = Array.from(container.querySelectorAll('span')).find(
      (el) => el.textContent === '81.57'
    );
    expect(glance?.className).toContain('text-amber-400/90');
    expect(glance?.className).toContain('font-mono');
    expect(glance?.className).toContain('text-base');
    expect(glance?.className).toContain('font-bold');
    expect(container.querySelector('h2')?.className).toContain('font-medium');
    unmount();
  });

  it('uses semibold sm glance on standard filled cards', () => {
    const { container, unmount } = renderCard({
      glanceLabel: '91.00',
      glanceFilled: true,
      size: 'standard',
    });
    const glance = Array.from(container.querySelectorAll('span')).find(
      (el) => el.textContent === '91.00'
    );
    expect(glance?.className).toContain('text-amber-400/90');
    expect(glance?.className).toContain('text-sm');
    expect(glance?.className).toContain('font-semibold');
    expect(glance?.className).not.toContain('text-base');
    unmount();
  });

  it('applies per-axis aurora gradient and neon border from shared tokens', () => {
    const { container, unmount } = renderCard();
    const link = container.querySelector('a') as HTMLAnchorElement;
    expect(link.style.backgroundImage).toContain('linear-gradient');
    expect(link.style.borderColor).toMatch(/^rgba?\(/);
    expect(link.style.getPropertyValue('--lobby-accent-rgb')).toMatch(/^\d+,\s*\d+,\s*\d+$/);
    expect(link.style.getPropertyValue('--lobby-border-hover')).toMatch(/^rgba?\(/);
    unmount();
  });

  it('mounts hero border beam only for hero size', () => {
    const { container, unmount } = renderCard({ size: 'hero' });
    expect(container.querySelector('.ui-lobby-card__beam-wrap')).not.toBeNull();
    expect(container.querySelector('.ui-lobby-card__beam')).not.toBeNull();
    unmount();
  });

  it('does not clip outer glow with overflow-hidden on the shell', () => {
    const { container, unmount } = renderCard();
    const link = container.querySelector('a');
    expect(link?.className.split(/\s+/)).not.toContain('overflow-hidden');
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

  it('renders a pure single-line title without subtitle tier', () => {
    const { container, unmount } = renderCard({ title: '五項力量', glanceLabel: '未測' });
    expect(container.querySelector('h2')?.textContent).toBe('五項力量');
    expect(container.querySelector('p')).toBeNull();
    expect(container.textContent).not.toContain('整車馬力');
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
