/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TachometerMilestoneBar from '../TachometerMilestoneBar';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'assessment.breakthrough.peakReached') return 'Peak reached';
      if (key === 'assessment.breakthrough.milestoneRemaining') {
        return `${String(options?.points)} pts until next tier`;
      }
      return key;
    },
  }),
}));

function renderBar(props: {
  remainingPoints: number | null;
  milestoneHintLabel?: string | null;
}): { container: HTMLDivElement; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <TachometerMilestoneBar
        progress01={0.5}
        remainingPoints={props.remainingPoints}
        animate={false}
        milestoneHintLabel={props.milestoneHintLabel}
      />
    );
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

describe('TachometerMilestoneBar milestone hint', () => {
  it('prefers milestoneHintLabel over points-only copy', () => {
    const { container, unmount } = renderBar({
      remainingPoints: 1,
      milestoneHintLabel: '1 pt guide (approx. +0.3 cm)',
    });
    expect(container.textContent).toContain('1 pt guide (approx. +0.3 cm)');
    expect(container.textContent).not.toContain('1 pts until next tier');
    unmount();
  });

  it('falls back to points-only when milestoneHintLabel is omitted', () => {
    const { container, unmount } = renderBar({ remainingPoints: 7 });
    expect(container.textContent).toContain('7 pts until next tier');
    unmount();
  });

  it('shows peak copy when remainingPoints is null even if a hint is passed', () => {
    const { container, unmount } = renderBar({
      remainingPoints: null,
      milestoneHintLabel: 'should not show',
    });
    expect(container.textContent).toContain('Peak reached');
    expect(container.textContent).not.toContain('should not show');
    unmount();
  });

  it('renders centered plain amber mission copy without a readout capsule', () => {
    const { container, unmount } = renderBar({
      remainingPoints: 1,
      milestoneHintLabel:
        '距離下一階升級尚需 1 分（縱跳約需 +0.3 cm 或立定跳遠約需 +0.9 cm）',
    });
    const hint = container.querySelector('[data-testid="tachometer-milestone-hint"]');
    expect(hint).not.toBeNull();
    expect(hint?.className).toContain('w-full');
    expect(hint?.className).toContain('flex');
    expect(hint?.className).toContain('justify-center');
    expect(hint?.className).toContain('items-center');
    expect(hint?.className).toContain('text-center');
    expect(hint?.className).toContain('text-xs');
    expect(hint?.className).toContain('font-medium');
    expect(hint?.className).toContain('tracking-wide');
    expect(hint?.className).toContain('text-amber-300');
    expect(hint?.className).toContain('mt-3.5');
    expect(hint?.className).toContain('mb-5');
    expect(hint?.className).not.toContain('bg-amber-500/[0.06]');
    expect(hint?.className).not.toContain('border-amber-500/15');
    expect(hint?.className).not.toContain('rounded-lg');
    expect(hint?.className).not.toContain('w-fit');
    expect(hint?.className).toContain('text-balance');
    unmount();
  });
});
