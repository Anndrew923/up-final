/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AssessmentSegmentedControl,
  AssessmentTabPanel,
} from '../AssessmentSegmentedControl';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('AssessmentSegmentedControl', () => {
  let container: HTMLDivElement;
  let root: Root;

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('highlights the selected segment and fires onChange', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    const onChange = vi.fn();

    act(() => {
      root.render(
        <AssessmentSegmentedControl
          value="jumps"
          ariaLabel="modes"
          onChange={onChange}
          options={[
            {
              id: 'jumps',
              tabId: 'tab-jumps',
              panelId: 'panel-jumps',
              label: 'Jumps',
              badgeLabel: 'Core',
              badgeTone: 'core',
            },
            {
              id: 'sprint',
              tabId: 'tab-sprint',
              panelId: 'panel-sprint',
              label: 'Sprint',
              badgeLabel: 'Specialty',
              badgeTone: 'specialty',
            },
          ]}
        />
      );
    });

    const jumps = container.querySelector('#tab-jumps');
    const sprint = container.querySelector('#tab-sprint');
    expect(jumps?.getAttribute('aria-selected')).toBe('true');
    expect(sprint?.getAttribute('aria-selected')).toBe('false');

    act(() => {
      sprint?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith('sprint');
  });
});

describe('AssessmentTabPanel', () => {
  let container: HTMLDivElement;
  let root: Root;

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('uses hidden class when inactive so CSS display utilities cannot resurrect it', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root.render(
        <AssessmentTabPanel id="panel" labelledBy="tab" active={false} className="grid gap-3">
          <span>body</span>
        </AssessmentTabPanel>
      );
    });

    const panel = container.querySelector('#panel');
    expect(panel?.hasAttribute('hidden')).toBe(true);
    expect(panel?.className).toBe('hidden');
    expect(panel?.className).not.toContain('grid');
  });

  it('applies active className when visible', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root.render(
        <AssessmentTabPanel id="panel" labelledBy="tab" active className="grid gap-3">
          <span>body</span>
        </AssessmentTabPanel>
      );
    });

    const panel = container.querySelector('#panel');
    expect(panel?.hasAttribute('hidden')).toBe(false);
    expect(panel?.className).toBe('grid gap-3');
  });
});
