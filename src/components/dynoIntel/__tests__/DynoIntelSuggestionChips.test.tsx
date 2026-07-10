/* @vitest-environment jsdom */
import { act } from 'react';
import type { ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DynoIntelSuggestionChips from '../DynoIntelSuggestionChips';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const ITEMS = [
  { id: 'overall' as const, label: 'Overall', query: 'How is my overall score right now?' },
  { id: 'methodology' as const, label: 'Formula', query: 'How are my scores calculated?' },
];

function renderChips(
  props: Partial<ComponentProps<typeof DynoIntelSuggestionChips>> = {}
): { container: HTMLDivElement; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  let root: Root | null = createRoot(container);
  const onSelect = vi.fn();

  act(() => {
    root!.render(
      <DynoIntelSuggestionChips
        items={ITEMS}
        visible
        onSelect={onSelect}
        {...props}
      />
    );
  });

  return {
    container,
    unmount: () => {
      act(() => root?.unmount());
      root = null;
      container.remove();
    },
  };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('DynoIntelSuggestionChips', () => {
  it('renders nothing when not visible', () => {
    const { container, unmount } = renderChips({ visible: false });
    expect(container.querySelector('button')).toBeNull();
    unmount();
  });

  it('fires onSelect with query payload on chip click', () => {
    const onSelect = vi.fn();
    const { container, unmount } = renderChips({ onSelect });
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(2);
    act(() => {
      buttons[0]!.click();
    });
    expect(onSelect).toHaveBeenCalledWith('How is my overall score right now?');
    unmount();
  });
});
