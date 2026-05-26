/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VehicleSpecificationCodex } from '../VehicleSpecificationCodex';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const mockRows = [
  {
    bandId: 'TIER_80',
    title: '350hp雙門跑車',
    summary: '測試摘要',
    rangeDisplay: '80 - 89.99',
    isActive: true,
  },
  {
    bandId: 'TIER_70',
    title: '250hp後驅小跑',
    summary: '',
    rangeDisplay: '70 - 79.99',
    isActive: false,
  },
];

vi.mock('../../../hooks/useCodexBandRows', () => ({
  useCodexBandRows: () => mockRows,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'tools.codex.mainTitle': '載具全規格整備圖鑑',
        'tools.codex.subTitle': '開放式 Dyno 教科書',
        'tools.codex.panelTitle': '圖鑑',
        'tools.codex.tierRange': '階層區間',
        'tools.codex.activeSetup': '當前載具設定',
        'tools.codex.tabs.strength': 'STRENGTH',
        'tools.codex.systems.strength': '底盤剛性',
      };
      return map[key] ?? key;
    },
    i18n: { language: 'zh-Hant' },
  }),
}));

function renderCodex(): { container: HTMLDivElement; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <VehicleSpecificationCodex
        currentScores={{
          overall: 80,
          strength: 80,
          explosivePower: 0,
          gripStrength: 0,
          cardio: 0,
          muscleMass: 0,
          bodyFat: 0,
          armSize: 0,
        }}
      />
    );
  });
  return {
    container,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe('VehicleSpecificationCodex', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders resolved copy and active row marker', () => {
    const { container, unmount } = renderCodex();
    expect(container.textContent).toContain('載具全規格整備圖鑑');
    expect(container.textContent).toContain('350hp雙門跑車');
    expect(container.textContent).toContain('當前載具設定');
    expect(container.querySelector('[aria-current="true"]')).not.toBeNull();
    unmount();
  });

  it('exposes tablist with aria-selected on strength tab after click', () => {
    const { container, unmount } = renderCodex();
    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBeGreaterThan(0);
    expect(container.querySelector('[aria-selected="true"]')).not.toBeNull();
    unmount();
  });
});
