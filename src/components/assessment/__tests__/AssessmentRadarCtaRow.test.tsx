/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AssessmentRadarCtaRow from '../AssessmentRadarCtaRow';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      key === 'assessment.writeToRadarAction'
        ? '寫入雷達 ➔'
        : key === 'assessment.calculateRadarAction'
          ? '計算雷達分數'
          : key,
  }),
}));

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('AssessmentRadarCtaRow', () => {
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

  it('renders Write-to-Radar full width when secondary is absent', () => {
    act(() => {
      root.render(<AssessmentRadarCtaRow hasScore={false} onClick={vi.fn()} />);
    });

    expect(container.textContent).toContain('計算雷達分數');
    expect(container.querySelectorAll('button')).toHaveLength(1);
  });

  it('places secondary report beside primary Write-to-Radar', () => {
    act(() => {
      root.render(
        <AssessmentRadarCtaRow
          hasScore
          onClick={vi.fn()}
          secondary={<button type="button">生成專項戰報</button>}
        />
      );
    });

    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(2);
    expect(container.textContent).toContain('生成專項戰報');
    expect(container.textContent).toContain('寫入雷達');
  });
});
