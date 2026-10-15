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
        'tools.somatotypeLab.entry.title': 'Somatochart',
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

  it('routes to the somatotype lab with open-entry copy', () => {
    const { container, unmount } = renderCard();
    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toBe(ROUTES.somatotypeLab);
    expect(link?.getAttribute('aria-label')).toBe('Somatochart');
    expect(container.textContent).toContain('Somatochart');
    expect(container.textContent).not.toContain('MORPHOLOGY LAB');
    expect(container.textContent).not.toContain('人體形態學實驗室');
    expect(container.textContent).not.toContain('Unlock');
    expect(container.textContent).not.toContain('解鎖');
    unmount();
  });
});
