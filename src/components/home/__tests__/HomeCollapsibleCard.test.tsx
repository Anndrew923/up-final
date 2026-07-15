/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomeCollapsibleCard } from '../HomeCollapsibleCard';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('HomeCollapsibleCard actionMode', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  function mount(actionMode: 'labeled' | 'chevron') {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root: Root = createRoot(container);
    act(() => {
      root.render(
        <HomeCollapsibleCard
          instanceId="test-home-card"
          expanded={false}
          onToggle={vi.fn()}
          kicker="BODY"
          title="Physical profile"
          toggleExpandLabel="Tap to edit"
          toggleCollapseLabel="Tap to collapse"
          actionMode={actionMode}
        >
          <p>body</p>
        </HomeCollapsibleCard>
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

  it('chevron mode hides expand copy but keeps it on aria-label', () => {
    const { container, unmount } = mount('chevron');
    expect(container.textContent).toContain('Physical profile');
    expect(container.textContent).not.toContain('Tap to edit');
    expect(container.querySelector('button')?.getAttribute('aria-label')).toBe('Tap to edit');
    expect(container.querySelector('svg')).not.toBeNull();
    unmount();
  });

  it('labeled mode shows expand copy in the visible action row', () => {
    const { container, unmount } = mount('labeled');
    expect(container.textContent).toContain('Tap to edit');
    expect(container.querySelector('button')?.getAttribute('aria-label')).toBe('Tap to edit');
    unmount();
  });
});
