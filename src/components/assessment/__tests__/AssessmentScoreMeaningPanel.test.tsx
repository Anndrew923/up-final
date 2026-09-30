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
    decadeKey: '100',
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
});
