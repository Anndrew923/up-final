/* @vitest-environment jsdom */
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { AssessmentPageHeader } from '../AssessmentPageHeader';
import { HeroNumberInput } from '../HeroNumberInput';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function renderNode(node: ReactNode): { container: HTMLDivElement; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(node);
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
  document.body.innerHTML = '';
});

describe('AssessmentPageHeader', () => {
  it('renders compact title hierarchy and optional meta slot', () => {
    const { container, unmount } = renderNode(
      <AssessmentPageHeader
        kicker="AXIS / GRIP"
        title="Grip Strength Test"
        meta={<span data-testid="meta-chip">Male</span>}
      />
    );

    const header = container.querySelector('header');
    const title = container.querySelector('h1');
    const meta = container.querySelector('[data-testid="meta-chip"]');

    expect(header?.className).toContain('space-y-1');
    expect(title?.className).toContain('text-2xl');
    expect(title?.className).toContain('sm:text-3xl');
    expect(title?.textContent).toBe('Grip Strength Test');
    expect(meta?.textContent).toBe('Male');

    unmount();
  });
});

describe('HeroNumberInput', () => {
  it('applies hero class without replacing consumer width utilities', () => {
    const { container, unmount } = renderNode(
      <HeroNumberInput aria-label="Peak grip" className="max-w-xs" defaultValue="120" />
    );
    const input = container.querySelector('input');

    expect(input?.className).toContain('ui-input-hero');
    expect(input?.className).toContain('max-w-xs');
    expect(input?.className.split(/\s+/)).not.toContain('ui-input');
    expect(input?.className).not.toContain('ui-input-hero--compact');

    unmount();
  });

  it('supports compact density without important text utilities', () => {
    const { container, unmount } = renderNode(
      <HeroNumberInput aria-label="Minutes" density="compact" className="w-28" />
    );
    const input = container.querySelector('input');

    expect(input?.className).toContain('ui-input-hero--compact');
    expect(input?.className).toContain('w-28');
    expect(input?.className).not.toContain('!text-2xl');

    unmount();
  });
});
