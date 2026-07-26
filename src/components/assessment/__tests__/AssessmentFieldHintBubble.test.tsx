/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { AssessmentFieldHintBubble } from '../AssessmentFieldHintBubble';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function renderBubble(props: {
  tip: string;
  footer?: string;
  active?: boolean;
}): {
  container: HTMLDivElement;
  root: Root;
  unmount: () => void;
  rerender: (next: { tip: string; footer?: string; active?: boolean }) => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const mount = (next: { tip: string; footer?: string; active?: boolean }) => {
    act(() => {
      root.render(
        <AssessmentFieldHintBubble
          ariaLabel="Hint"
          tip={next.tip}
          footer={next.footer}
          active={next.active}
        />
      );
    });
  };
  mount(props);
  return {
    container,
    root,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
    rerender: mount,
  };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('AssessmentFieldHintBubble', () => {
  it('toggles short tip bubble and closes on Escape', () => {
    const { container, unmount } = renderBubble({
      tip: 'Run 12 minutes.',
      footer: 'See reference below.',
    });

    const toggle = container.querySelector('button[aria-label="Hint"]');
    expect(toggle).toBeTruthy();
    expect(container.textContent).not.toContain('Run 12 minutes.');

    act(() => {
      toggle!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.textContent).toContain('Run 12 minutes.');
    expect(container.textContent).toContain('See reference below.');
    expect(toggle?.getAttribute('aria-expanded')).toBe('true');

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(container.textContent).not.toContain('Run 12 minutes.');
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');

    unmount();
  });

  it('force-closes when active becomes false', () => {
    const { container, rerender, unmount } = renderBubble({
      tip: 'Run 12 minutes.',
      active: true,
    });
    const toggle = container.querySelector('button[aria-label="Hint"]');
    act(() => {
      toggle!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.textContent).toContain('Run 12 minutes.');

    rerender({ tip: 'Run 12 minutes.', active: false });
    expect(container.textContent).not.toContain('Run 12 minutes.');

    unmount();
  });
});
