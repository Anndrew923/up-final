/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AssessmentHeroScoreWithNormBadge from '../AssessmentHeroScoreWithNormBadge';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('AssessmentHeroScoreWithNormBadge', () => {
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

  it('defaults preview companion chips to sm size', () => {
    act(() => {
      root.render(
        <AssessmentHeroScoreWithNormBadge
          scoreText="87.80"
          populationClass="高階玩家"
          decadeKey="80"
        />
      );
    });

    expect(container.textContent).toContain('87.80');
    const chip = container.querySelector('span[aria-label="高階玩家"]');
    expect(chip?.className).toContain('text-[10px]');
  });

  it('defaults breakthrough variant to md badge size', () => {
    act(() => {
      root.render(
        <AssessmentHeroScoreWithNormBadge
          variant="breakthrough"
          scoreText="87.80"
          populationClass="高階玩家"
          decadeKey="80"
          onBadgeClick={vi.fn()}
          showChevron
        />
      );
    });

    const button = container.querySelector('button');
    expect(button?.className).toContain('text-sm');
    expect(button?.className).toContain('px-3.5');
  });

  it('forwards expand controls to the interactive badge', () => {
    act(() => {
      root.render(
        <AssessmentHeroScoreWithNormBadge
          variant="breakthrough"
          scoreText="87.80"
          populationClass="高階玩家"
          decadeKey="80"
          onBadgeClick={vi.fn()}
          badgeExpanded
          showChevron
          badgeAriaControls="summary-id"
          badgeAriaLabel="Collapse 高階玩家"
        />
      );
    });

    const button = container.querySelector('button');
    expect(button?.getAttribute('aria-expanded')).toBe('true');
    expect(button?.getAttribute('aria-controls')).toBe('summary-id');
    expect(button?.getAttribute('aria-label')).toBe('Collapse 高階玩家');
  });
});
