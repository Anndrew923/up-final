/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AssessmentScoreMeaningPanel, {
  highlightMilestoneNumerals,
} from '../AssessmentScoreMeaningPanel';

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
    nextMilestone: 110,
    remainingPoints: 8,
  };

  it('renders Hall entry CTA when hallEntry is provided', () => {
    const onClick = vi.fn();
    act(() => {
      root.render(
        <AssessmentScoreMeaningPanel
          headerLabel="PERFORMANCE SPEC"
          meaning={meaning}
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
    // WHY: Ghost Hall CTA — no border slab competing with NormBadge / tier chrome.
    expect(button?.className).not.toContain('border-amber-500/40');

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
          meaning={{ ...meaning, decadeKey: '80', bandId: 'TIER_80', nextMilestone: 90, remainingPoints: 2 }}
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
          milestoneHintLabel="距離下一階升級尚需 2 分"
        />
      );
    });

    expect(container.textContent).toContain('87.80');
    expect(container.textContent).toContain('高階玩家');
    expect(container.textContent).toContain('凡體覺醒');
    expect(container.textContent).not.toContain('SHOULD NOT SHOW');
    expect(container.textContent).toContain('距離下一階升級尚需');

    const score = Array.from(container.querySelectorAll('p')).find((el) =>
      el.textContent?.includes('87.80')
    );
    expect(score?.className).toContain('text-amber-300');
    expect(score?.className).not.toContain('text-accent-info');

    const section = container.querySelector('section');
    expect(section?.className).toContain('border-amber-400/35');

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

  it('keeps milestone copy zinc-muted with highlighted numerals', () => {
    act(() => {
      root.render(
        <AssessmentScoreMeaningPanel
          meaning={meaning}
          milestoneHintLabel="距離下一階升級尚需 8 分"
        />
      );
    });

    const milestone = Array.from(container.querySelectorAll('p')).find((el) =>
      el.textContent?.includes('距離下一階升級尚需')
    );
    expect(milestone?.className).toContain('text-zinc-400');
    const highlight = milestone?.querySelector('.text-zinc-200');
    expect(highlight?.textContent).toBe('8');
  });
});

describe('highlightMilestoneNumerals', () => {
  it('wraps numeric tokens for muted-line emphasis', () => {
    const nodes = highlightMilestoneNumerals('距離下一階升級尚需 12.5 分');
    expect(Array.isArray(nodes)).toBe(true);
  });
});
