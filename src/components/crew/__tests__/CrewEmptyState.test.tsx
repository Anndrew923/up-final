/* @vitest-environment jsdom */
import { act, type ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ROUTES } from '../../../config/routes';
import CrewEmptyState from '../CrewEmptyState';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

function renderEmpty(props: Partial<ComponentProps<typeof CrewEmptyState>> = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const defaults = {
    isPro: false,
    busy: false,
    actionError: null,
    onJoin: vi.fn(async () => undefined),
    onCreate: vi.fn(async () => undefined),
    onClearError: vi.fn(),
    ...props,
  };
  act(() => {
    root.render(
      <MemoryRouter>
        <CrewEmptyState {...defaults} />
      </MemoryRouter>
    );
  });
  return { container, root, defaults };
}

function findCreateCta(container: HTMLElement) {
  return Array.from(container.querySelectorAll('button')).find((b) =>
    b.textContent?.includes('crew.empty.createCta')
  );
}

describe('CrewEmptyState', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    navigateMock.mockReset();
    if (root && container) {
      act(() => {
        root!.unmount();
      });
      container.remove();
    }
    root = null;
    container = null;
  });

  it('routes non-Pro create tap to Join Arena pro-upsell with crew returnTo', () => {
    const rendered = renderEmpty({ isPro: false });
    container = rendered.container;
    root = rendered.root;

    const createBtn = findCreateCta(container);
    expect(createBtn).toBeTruthy();
    act(() => {
      createBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(navigateMock).toHaveBeenCalledWith(expect.stringContaining('from=pro-upsell'));
    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringContaining(`returnTo=${encodeURIComponent(ROUTES.crew)}`)
    );
    expect(container.textContent).not.toContain('crew.empty.nameLabel');
  });

  it('does not navigate when create is busy', () => {
    const rendered = renderEmpty({ isPro: false, busy: true });
    container = rendered.container;
    root = rendered.root;

    const createBtn = findCreateCta(container);
    expect(createBtn?.disabled).toBe(true);
    act(() => {
      createBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('expands create form for Pro members', () => {
    const rendered = renderEmpty({ isPro: true });
    container = rendered.container;
    root = rendered.root;

    const createBtn = findCreateCta(container);
    act(() => {
      createBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(navigateMock).not.toHaveBeenCalled();
    expect(container.textContent).toContain('crew.empty.nameLabel');
    expect(container.textContent).toContain('crew.empty.tagLabel');
  });

  it('omits join/create hint and legacy paywall copy keys', () => {
    const rendered = renderEmpty();
    container = rendered.container;
    root = rendered.root;
    expect(container.textContent).not.toContain('crew.empty.joinHint');
    expect(container.textContent).not.toContain('crew.empty.createHint');
    expect(container.textContent).not.toContain('crew.empty.proRequired');
    expect(container.textContent).not.toContain('crew.empty.upgradeCta');
  });
});
