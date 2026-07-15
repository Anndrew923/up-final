/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DisclosurePanel } from '../DisclosurePanel';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('DisclosurePanel actionMode', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  function mount(actionMode: 'labeled' | 'chevron') {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root: Root = createRoot(container);
    act(() => {
      root.render(
        <DisclosurePanel
          instanceId="test-disclosure"
          expanded={false}
          onToggle={vi.fn()}
          title="當前性能六軸快照"
          toggleExpandLabel="展開性能六軸快照"
          toggleCollapseLabel="收合性能六軸快照"
          actionMode={actionMode}
        >
          <p>body</p>
        </DisclosurePanel>
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

  it('labeled mode shows expand copy in the visible action row', () => {
    const { container, unmount } = mount('labeled');
    expect(container.textContent).toContain('展開性能六軸快照');
    expect(container.querySelector('button')?.getAttribute('aria-label')).toBe(
      '展開性能六軸快照'
    );
    unmount();
  });

  it('chevron mode hides expand copy but keeps it on aria-label', () => {
    const { container, unmount } = mount('chevron');
    expect(container.textContent).toContain('當前性能六軸快照');
    expect(container.textContent).not.toContain('展開性能六軸快照');
    expect(container.querySelector('button')?.getAttribute('aria-label')).toBe(
      '展開性能六軸快照'
    );
    expect(container.querySelector('svg')).not.toBeNull();
    unmount();
  });
});
