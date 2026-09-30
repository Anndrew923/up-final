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
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'assessment.calculateRadarWithAxis') {
        return `Calculate Assessment (${String(options?.axis ?? '')}) ➔`;
      }
      if (key === 'assessment.writeToRadarWithAxis') {
        return `Write to Radar (${String(options?.axis ?? '')}) ➔`;
      }
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
      root.render(
        <AssessmentWriteToRadarButton
          axisLabel="馬力"
          hasScore={false}
          onClick={onClick}
        />
      );
    });

    const button = container.querySelector('button');
    expect(button?.className).toContain('w-full');
    expect(button?.className).toContain('bg-amber-500');
    expect(button?.textContent).toContain('Calculate Assessment (馬力)');
    expect(button?.textContent).not.toContain('Write to Radar');

    act(() => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows write-to-radar copy when hasScore is true', () => {
    act(() => {
      root.render(
        <AssessmentWriteToRadarButton axisLabel="Traction" hasScore />
      );
    });

    expect(container.querySelector('button')?.textContent).toContain('Write to Radar (Traction)');
    expect(container.textContent).not.toContain('Calculate Assessment');
  });

  it('honors disabled state', () => {
    act(() => {
      root.render(
        <AssessmentWriteToRadarButton axisLabel="Stint" hasScore={false} disabled />
      );
    });
    expect(container.querySelector('button')?.disabled).toBe(true);
  });
});
