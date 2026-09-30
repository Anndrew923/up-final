/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PerformanceBreakthroughPayload } from '../../../logic/core/performanceBreakthrough';
import PerformanceBreakthroughModal from '../PerformanceBreakthroughModal';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'assessment.breakthrough.normBadgeExpandAria') {
        return `Expand ${String(options?.populationClass ?? '')}`;
      }
      if (key === 'assessment.breakthrough.normBadgeCollapseAria') {
        return `Collapse ${String(options?.populationClass ?? '')}`;
      }
      if (key === 'assessment.breakthrough.summaryRegionAria') {
        return `${String(options?.populationClass ?? '')} tier explanation`;
      }
      if (key === 'assessment.breakthrough.closeAria') return 'Close';
      if (key === 'assessment.breakthrough.kicker') return 'Axis Breakthrough';
      if (key === 'assessment.breakthrough.confirmDismiss') return 'CONFIRM';
      if (key === 'assessment.breakthrough.syncBtn') return 'Sync';
      return key;
    },
  }),
}));

vi.mock('../../../hooks/useFocusTrap', () => ({
  useFocusTrap: () => undefined,
}));

vi.mock('../../../hooks/useShellScrollLock', () => ({
  useShellScrollLock: () => undefined,
}));

vi.mock('../../../hooks/useLadderUploadGateSheet', () => ({
  useLadderUploadGateSheet: () => ({
    gateSheetOpen: false,
    gateSheetKind: null,
    tryOpenGateSheet: () => false,
    closeGateSheet: vi.fn(),
    confirmGateSheet: vi.fn(),
    resetGateSheet: vi.fn(),
  }),
}));

vi.mock('../../ladder/LadderUploadGateSheetPortal', () => ({
  default: () => null,
}));

const basePayload: PerformanceBreakthroughPayload = {
  metric: 'strength',
  score: 87.8,
  scoreDisplay: '87.80',
  title: '350hp雙門跑車',
  summary: '這是一段應預設收折的長解說文案。',
  bandId: 'TIER_80',
  decadeKey: '80',
  populationClass: '高階玩家',
  auraKey: 'flow',
  auraLabel: 'Flow',
  milestone: {
    currentMin: 80,
    nextMin: 90,
    progress01: 0.78,
    remainingPoints: 3,
  },
};

describe('PerformanceBreakthroughModal summary disclosure', () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
    document.body.querySelectorAll('[role="dialog"]').forEach((node) => node.remove());
  });

  it('keeps summary collapsed by default and expands on badge click', () => {
    act(() => {
      root.render(
        <PerformanceBreakthroughModal open payload={basePayload} onClose={vi.fn()} />
      );
    });

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();

    const summary = Array.from(document.querySelectorAll('p')).find((el) =>
      el.textContent?.includes('應預設收折')
    );
    expect(summary).toBeDefined();
    expect(summary?.getAttribute('aria-hidden')).toBe('true');

    const badge = Array.from(document.querySelectorAll('button')).find((el) =>
      el.getAttribute('aria-label')?.includes('Expand')
    );
    expect(badge).toBeDefined();
    expect(badge?.getAttribute('aria-expanded')).toBe('false');
    expect(badge?.querySelector('svg')).not.toBeNull();

    act(() => {
      badge?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const expandedBadge = Array.from(document.querySelectorAll('button')).find((el) =>
      el.getAttribute('aria-label')?.includes('Collapse')
    );
    expect(expandedBadge?.getAttribute('aria-expanded')).toBe('true');
    expect(summary?.getAttribute('aria-hidden')).toBe('false');
  });

  it('resets expanded state when payload identity changes while open', () => {
    act(() => {
      root.render(
        <PerformanceBreakthroughModal open payload={basePayload} onClose={vi.fn()} />
      );
    });

    const badge = Array.from(document.querySelectorAll('button')).find((el) =>
      el.getAttribute('aria-label')?.includes('Expand')
    );
    act(() => {
      badge?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(
      Array.from(document.querySelectorAll('button')).find((el) =>
        el.getAttribute('aria-label')?.includes('Collapse')
      )?.getAttribute('aria-expanded')
    ).toBe('true');

    const nextPayload: PerformanceBreakthroughPayload = {
      ...basePayload,
      score: 92,
      scoreDisplay: '92.00',
      populationClass: '凡人頂尖',
      decadeKey: '90',
      bandId: 'TIER_90',
    };

    act(() => {
      root.render(
        <PerformanceBreakthroughModal open payload={nextPayload} onClose={vi.fn()} />
      );
    });

    const resetBadge = Array.from(document.querySelectorAll('button')).find((el) =>
      el.getAttribute('aria-label')?.includes('Expand')
    );
    expect(resetBadge?.getAttribute('aria-expanded')).toBe('false');
  });

  it('renders a static badge without chevron when summary is empty', () => {
    const emptySummaryPayload: PerformanceBreakthroughPayload = {
      ...basePayload,
      summary: '   ',
    };

    act(() => {
      root.render(
        <PerformanceBreakthroughModal open payload={emptySummaryPayload} onClose={vi.fn()} />
      );
    });

    const expandBadge = Array.from(document.querySelectorAll('button')).find((el) =>
      el.getAttribute('aria-label')?.includes('Expand')
    );
    expect(expandBadge).toBeUndefined();
    expect(document.querySelector('span[aria-label="高階玩家"]')).not.toBeNull();
    expect(
      Array.from(document.querySelectorAll('p')).some((el) =>
        el.textContent?.includes('應預設收折')
      )
    ).toBe(false);
  });
});
