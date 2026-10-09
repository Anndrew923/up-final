/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AssessmentScoreMeaningPanel from '../AssessmentScoreMeaningPanel';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('AssessmentScoreMeaningPanel', () => {
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

  const meaning = {
    title: '凡體覺醒',
    summary: 'Summary copy.',
    bandId: 'TIER_100',
    decadeKey: '100' as const,
    populationClass: '凡體覺醒',
    nextMilestone: null,
    remainingPoints: null,
  };

  it('renders Hall entry CTA when hallEntry is provided', () => {
    const onClick = vi.fn();
    act(() => {
      root.render(
        <AssessmentScoreMeaningPanel
          headerLabel="PERFORMANCE SPEC"
          meaning={meaning}
          tone="amber"
          hallEntry={{
            onClick,
            label: '名人堂光譜 ➔',
            ariaLabel: '開啟名人堂常模光譜',
          }}
        />
      );
    });

    const button = container.querySelector('button[aria-label="開啟名人堂常模光譜"]');
    expect(button).not.toBeNull();
    expect(button?.textContent).toContain('名人堂光譜');
    expect(button?.className).toContain('min-h-9');

    act(() => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('hides Hall entry when hallEntry is null', () => {
    act(() => {
      root.render(
        <AssessmentScoreMeaningPanel
          headerLabel="PERFORMANCE SPEC"
          meaning={meaning}
          tone="amber"
          hallEntry={null}
        />
      );
    });

    expect(container.querySelector('button')).toBeNull();
    expect(container.textContent).toContain('PERFORMANCE SPEC');
  });

  it('integrates hero score + NormBadge in the header and demotes headerLabel', () => {
    const onBadge = vi.fn();
    const onHall = vi.fn();
    act(() => {
      root.render(
        <AssessmentScoreMeaningPanel
          headerLabel="SHOULD NOT SHOW"
          meaning={meaning}
          tone="blue"
          hero={{
            scoreText: '87.80',
            populationClass: '高階玩家',
            decadeKey: '80',
            onBadgeClick: onBadge,
            showChevron: true,
            badgeSize: 'md',
            chevronTone: 'forward',
            badgeAriaLabel: '開啟「高階玩家」名人堂光譜',
          }}
          hallEntry={{
            onClick: onHall,
            label: '名人堂光譜 ➔',
            ariaLabel: '開啟名人堂常模光譜',
          }}
        />
      );
    });

    expect(container.textContent).toContain('87.80');
    expect(container.textContent).toContain('高階玩家');
    expect(container.textContent).toContain('凡體覺醒');
    expect(container.textContent).not.toContain('SHOULD NOT SHOW');

    const badge = container.querySelector('button[aria-label="開啟「高階玩家」名人堂光譜"]');
    expect(badge).not.toBeNull();
    act(() => {
      badge?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onBadge).toHaveBeenCalledTimes(1);

    const hall = container.querySelector('button[aria-label="開啟名人堂常模光譜"]');
    expect(hall).not.toBeNull();
    act(() => {
      hall?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onHall).toHaveBeenCalledTimes(1);
  });
});
