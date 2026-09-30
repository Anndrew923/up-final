/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NormBadgeChip, { resolveNormBadgeToneClass } from '../NormBadgeChip';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('resolveNormBadgeToneClass', () => {
  it('uses muted slate for sub-60 decades', () => {
    expect(resolveNormBadgeToneClass('0')).toContain('zinc');
    expect(resolveNormBadgeToneClass('40')).toContain('zinc');
    expect(resolveNormBadgeToneClass('50')).toContain('zinc');
    expect(resolveNormBadgeToneClass(null)).toContain('zinc');
  });

  it('uses ice blue at decade 60', () => {
    expect(resolveNormBadgeToneClass('60')).toContain('sky');
  });

  it('uses amber for 70–99', () => {
    expect(resolveNormBadgeToneClass('70')).toContain('amber');
    expect(resolveNormBadgeToneClass('90')).toContain('amber');
  });

  it('escalates metal chroma for 100+', () => {
    expect(resolveNormBadgeToneClass('100')).toContain('orange');
    expect(resolveNormBadgeToneClass('120')).toContain('violet');
    expect(resolveNormBadgeToneClass('150')).toContain('amber-300');
  });

  it('appends hue-matched hover fills only when interactive', () => {
    expect(resolveNormBadgeToneClass('60')).not.toContain('hover:bg-sky-500/20');
    expect(resolveNormBadgeToneClass('60', true)).toContain('hover:bg-sky-500/20');
    expect(resolveNormBadgeToneClass('80', true)).toContain('hover:bg-amber-500/20');
    expect(resolveNormBadgeToneClass('100', true)).toContain('hover:bg-orange-500/20');
    expect(resolveNormBadgeToneClass('120', true)).toContain('hover:bg-violet-500/20');
    // WHY: Never force amber hover over non-amber decades (cn has no twMerge).
    expect(resolveNormBadgeToneClass('60', true)).not.toContain('hover:bg-amber-500/20');
  });
});

describe('NormBadgeChip', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('renders a quiet static chip without chevron when not interactive', () => {
    act(() => {
      root.render(<NormBadgeChip populationClass="高階玩家" decadeKey="80" />);
    });

    expect(container.querySelector('[role="status"]')).toBeNull();
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('svg')).toBeNull();
    expect(container.textContent).toContain('高階玩家');
    expect(container.querySelector('span[aria-label="高階玩家"]')).not.toBeNull();
  });

  it('renders a button with aria-expanded and chevron when interactive', () => {
    const onClick = vi.fn();
    act(() => {
      root.render(
        <NormBadgeChip
          populationClass="高階玩家"
          decadeKey="80"
          onClick={onClick}
          expanded={false}
          showChevron
          ariaControls="summary-panel"
          ariaLabel="展開「高階玩家」級距說明"
        />
      );
    });

    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    expect(button?.getAttribute('aria-expanded')).toBe('false');
    expect(button?.getAttribute('aria-controls')).toBe('summary-panel');
    expect(button?.getAttribute('aria-label')).toBe('展開「高階玩家」級距說明');
    expect(button?.getAttribute('title')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();

    act(() => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('returns null for empty populationClass', () => {
    act(() => {
      root.render(<NormBadgeChip populationClass="   " />);
    });
    expect(container.textContent).toBe('');
  });

  it('applies md size classes for modal hero touch targets', () => {
    act(() => {
      root.render(
        <NormBadgeChip
          populationClass="高階玩家"
          decadeKey="80"
          size="md"
          onClick={vi.fn()}
          showChevron
        />
      );
    });

    const button = container.querySelector('button');
    expect(button?.className).toContain('text-sm');
    expect(button?.className).toContain('px-3.5');
    expect(button?.className).toContain('py-1.5');
    // SVGAnimatedString in jsdom — prefer getAttribute for class tokens.
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('h-3.5');
  });

  it('keeps sm size by default for quiet assessment companion chips', () => {
    act(() => {
      root.render(<NormBadgeChip populationClass="高階玩家" decadeKey="80" />);
    });

    const chip = container.querySelector('span[aria-label="高階玩家"]');
    expect(chip?.className).toContain('text-[10px]');
    expect(chip?.className).toContain('px-2.5');
  });
});
