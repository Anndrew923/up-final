import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../../i18n';
import { buildLogEvolutionReport } from '../../../logic/core/logEvolutionReport';
import type { LocalHistoryRecord } from '../../../logic/core/localHistoryRecord';
import LogEvolutionCard from '../LogEvolutionCard';

vi.mock('../../radar/HexRadarChart', () => ({
  default: () => <div data-testid="hex-radar-mock" />,
}));

const DAY1: LocalHistoryRecord = {
  id: 'day1',
  createdAt: '2026-01-01T00:00:00.000Z',
  overallScore: 84.3,
  scores: {
    strength: 80,
    explosivePower: 82,
    cardio: 78,
    muscleMass: 85,
    bodyFat: 88,
    gripStrength: 84,
  },
};

const NOW: LocalHistoryRecord = {
  id: 'now',
  createdAt: '2026-03-01T00:00:00.000Z',
  overallScore: 90.47,
  scores: {
    strength: 92,
    explosivePower: 90,
    cardio: 88,
    muscleMass: 91,
    bodyFat: 90,
    gripStrength: 89,
  },
};

function renderCard(onShare = vi.fn(), sharing = false) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const report = buildLogEvolutionReport([DAY1, NOW]);
  act(() => {
    root.render(
      <LogEvolutionCard
        report={report}
        sharing={sharing}
        onShare={onShare}
        onSelectDay1Baseline={() => undefined}
        onSelectPreviousLog={() => undefined}
      />
    );
  });
  const cleanup = () => {
    act(() => root.unmount());
    container.remove();
  };
  return { container, root, onShare, report, cleanup };
}

describe('LogEvolutionCard circular share Icon', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('keeps a circular share Icon beside the chevron while collapsed', () => {
    const { container, onShare, cleanup } = renderCard();
    const share = container.querySelector(
      '[data-testid="log-evolution-share"]'
    ) as HTMLButtonElement | null;
    const toggle = container.querySelector(
      '[data-testid="log-evolution-toggle"]'
    ) as HTMLButtonElement | null;

    expect(share).toBeTruthy();
    expect(toggle).toBeTruthy();
    expect(share?.getAttribute('aria-label')).toBe('Share evolution');
    expect(share?.className).toContain('rounded-full');
    expect(share?.className).toContain('h-6');
    expect(share?.textContent).not.toContain('Share');
    expect(share?.textContent).not.toContain('SHARE');

    const pills = container.querySelector('[data-testid="log-evolution-collapsed-pills"]');
    expect(pills?.textContent).toContain('Baseline: DAY 1');
    expect(pills?.textContent).not.toContain('Share');
    expect(container.querySelector('[data-testid="log-evolution-share-collapsed"]')).toBeNull();

    act(() => {
      share?.click();
    });
    expect(onShare).toHaveBeenCalledTimes(1);

    cleanup();
  });

  it('keeps the same share Icon available after expand (not in the toolbar)', () => {
    const { container, onShare, cleanup } = renderCard();
    const toggle = container.querySelector(
      '[data-testid="log-evolution-toggle"]'
    ) as HTMLButtonElement;

    act(() => {
      toggle.click();
    });

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(container.querySelector('[data-testid="log-evolution-collapsed-pills"]')).toBeNull();

    const share = container.querySelector(
      '[data-testid="log-evolution-share"]'
    ) as HTMLButtonElement | null;
    const switcher = container.querySelector('[data-testid="log-evolution-baseline-switcher"]');
    expect(share?.getAttribute('aria-label')).toBe('Share evolution');
    expect(switcher?.contains(share)).toBe(false);
    expect(switcher?.textContent).not.toContain('SHARE EVOLUTION');

    act(() => {
      share?.click();
    });
    expect(onShare).toHaveBeenCalledTimes(1);

    cleanup();
  });

  it('shows composing aria-label while sharing', () => {
    const { container, cleanup } = renderCard(vi.fn(), true);
    const share = container.querySelector(
      '[data-testid="log-evolution-share"]'
    ) as HTMLButtonElement | null;
    expect(share?.getAttribute('aria-label')).toBe('COMPOSING…');
    expect(share?.getAttribute('aria-busy')).toBe('true');
    expect(share?.disabled).toBe(true);
    cleanup();
  });

  it('uses short DAY 1 baseline pill in zh-Hant', async () => {
    await i18n.changeLanguage('zh-Hant');
    const { container, cleanup } = renderCard();
    const pills = container.querySelector('[data-testid="log-evolution-collapsed-pills"]');
    expect(pills?.textContent).toContain('基準：DAY 1');
    expect(pills?.textContent).not.toContain('DAY 1 基準');
    const share = container.querySelector('[data-testid="log-evolution-share"]');
    expect(share?.getAttribute('aria-label')).toBe('分享進化');
    cleanup();
  });
});
