/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ROUTES } from '../../../config/routes';
import { SomatotypeLabEntryCard } from '../SomatotypeLabEntryCard';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'tools.somatotypeLab.kicker': 'MORPHOLOGY LAB',
        'tools.somatotypeLab.entry.title': 'Unlock Your Somatochart',
        'tools.somatotypeLab.entry.subtitle': 'Discover your frame genetics.',
      };
      return map[key] ?? key;
    },
  }),
}));

function renderCard(): { container: HTMLDivElement; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter>
        <SomatotypeLabEntryCard />
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

describe('SomatotypeLabEntryCard', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('routes to the somatotype lab with inclusive entry copy', () => {
    const { container, unmount } = renderCard();
    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toBe(ROUTES.somatotypeLab);
    expect(link?.getAttribute('aria-label')).toBe('Unlock Your Somatochart');
    expect(container.textContent).toContain('Unlock Your Somatochart');
    expect(container.textContent).toContain('Discover your frame genetics.');
    unmount();
  });
});
