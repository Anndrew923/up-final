/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AssessmentWriteToRadarButton from '../AssessmentWriteToRadarButton';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'assessment.calculateRadarAction') return 'Calculate ➔';
      if (key === 'assessment.writeToRadarAction') return 'Write to Radar ➔';
      return key;
    },
  }),
}));

describe('AssessmentWriteToRadarButton', () => {
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

  it('shows calculate copy when hasScore is false', () => {
    const onClick = vi.fn();
    act(() => {
      root.render(<AssessmentWriteToRadarButton hasScore={false} onClick={onClick} />);
    });

    const button = container.querySelector('button');
    expect(button?.className).toContain('w-full');
    expect(button?.className).toContain('bg-amber-500');
    expect(button?.className).toContain('text-center');
    expect(button?.textContent).toBe('Calculate ➔');

    act(() => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows write-to-radar copy when hasScore is true', () => {
    act(() => {
      root.render(<AssessmentWriteToRadarButton hasScore />);
    });

    expect(container.querySelector('button')?.textContent).toBe('Write to Radar ➔');
  });

  it('honors disabled state', () => {
    act(() => {
      root.render(<AssessmentWriteToRadarButton hasScore={false} disabled />);
    });
    expect(container.querySelector('button')?.disabled).toBe(true);
  });
});
