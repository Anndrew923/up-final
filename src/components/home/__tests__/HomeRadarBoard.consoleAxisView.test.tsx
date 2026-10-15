/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../../i18n';
import { CONSOLE_AXIS_VIEW_MODE_STORAGE_KEY } from '../../../services/localStorageService';
import { HomeRadarBoard } from '../HomeRadarBoard';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const memory = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  },
  removeItem: (key: string) => {
    memory.delete(key);
  },
  clear: () => {
    memory.clear();
  },
});

vi.mock('../../../hooks/useCoreSixRadar', () => ({
  useCoreSixRadar: () => ({
    radarPoints: [
      { key: 'strength', value: 71.4, label: '力量' },
      { key: 'explosivePower', value: 80, label: '爆發力' },
      { key: 'cardio', value: 90, label: '心肺' },
      { key: 'muscleMass', value: 70, label: '肌肉量' },
      { key: 'bodyFat', value: 85, label: 'FFMI' },
      { key: 'gripStrength', value: 91, label: '握力' },
    ],
    overallScore: 81.23,
    scaleMax: 120,
  }),
}));

vi.mock('../../../hooks/useHomeResonanceRitual', () => ({
  useHomeResonanceRitual: () => ({
    open: false,
    phase: 'idle',
    ritualFill: 0,
    displayScore: 0,
    showBootScore: false,
    typedGradeLine: '',
    snapshot: null,
    startRitual: vi.fn(),
    closeRitual: vi.fn(),
  }),
}));

vi.mock('../../../stores/uiInteractionStore', () => ({
  useShellInteractionBlocked: () => false,
}));

vi.mock('../../ladder/LeaderboardSyncAllBar', () => ({
  default: () => <div data-testid="sync-bar" />,
}));

vi.mock('../HomeDiagnosticsPanel', () => ({
  default: () => <div data-testid="diagnostics" />,
}));

vi.mock('../HomeResonanceOverlay', () => ({
  default: () => null,
}));

vi.mock('../../radar/HexRadarChart', () => ({
  default: ({ points }: { points: Array<{ label: string }> }) => (
    <div data-testid="radar">{points.map((p) => p.label).join('|')}</div>
  ),
}));

vi.mock('../../../services/hapticService', () => ({
  hapticService: {
    trigger: vi.fn(),
    triggerContinuousSoft: vi.fn(),
    stopContinuousSoft: vi.fn(),
  },
}));

describe('HomeRadarBoard console axis view', () => {
  let container: HTMLDivElement | undefined;
  let root: Root | undefined;

  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  beforeEach(() => {
    memory.clear();
  });

  afterEach(() => {
    if (root) {
      const mounted = root;
      act(() => {
        mounted.unmount();
      });
    }
    container?.remove();
    memory.clear();
  });

  function renderBoard(): void {
    container = document.createElement('div');
    document.body.appendChild(container);
    const nextRoot = createRoot(container);
    root = nextRoot;
    act(() => {
      nextRoot.render(
        <I18nextProvider i18n={i18n}>
          <MemoryRouter>
            <HomeRadarBoard />
          </MemoryRouter>
        </I18nextProvider>
      );
    });
  }

  it('defaults to fitness lexicon and 2dp HUD values', () => {
    renderBoard();
    expect(container!.textContent).toContain('五項力量');
    expect(container!.textContent).toContain('綜合戰力指數');
    expect(container!.textContent).not.toContain('整車性能指數');
    expect(container!.textContent).not.toContain('整車馬力 // HP');
    expect(container!.textContent).toContain('71.40');
    expect(container!.querySelector('[data-testid="radar"]')?.textContent).toContain('力量');
    expect(container!.querySelector('[data-testid="radar"]')?.textContent).not.toContain('馬力');
    expect(container!.querySelector('[data-console-mode="fitness"]')).not.toBeNull();
    expect(container!.querySelector('.ui-console-radar-aura')).not.toBeNull();
  });

  it('stacks a full-width centered title above the view toggle', () => {
    renderBoard();
    const titleRow = container!.querySelector('[data-testid="console-title-row"]');
    expect(titleRow?.className).toContain('flex');
    expect(titleRow?.className).toContain('flex-col');
    expect(titleRow?.className).toContain('items-center');
    expect(titleRow?.children).toHaveLength(2);
    const title = titleRow?.querySelector('h2');
    expect(title?.textContent).toBe('性能儀表');
    expect(title?.className).toContain('w-full');
    expect(title?.className).toContain('text-center');
    const trailing = titleRow?.querySelector(
      '[data-testid="console-axis-view-toggle"]'
    ) as HTMLElement | null;
    expect(trailing?.className).toContain('mt-1.5');
    expect(trailing?.className).toContain('justify-center');
    expect(trailing?.querySelector('[role="group"]')).not.toBeNull();
  });

  it('renders the full EN console title on its own row above the view toggle', async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    try {
      renderBoard();
      const titleRow = container!.querySelector('[data-testid="console-title-row"]');
      expect(titleRow?.className).toContain('flex-col');
      expect(titleRow?.children).toHaveLength(2);
      expect(titleRow?.querySelector('h2')?.textContent).toBe('PERFORMANCE MAP');
      expect(titleRow?.querySelector('h2')?.className).toContain('w-full');
      expect(titleRow?.querySelector('h2')?.className).toContain('text-center');
      const liveToggle = titleRow?.querySelector('[data-testid="console-axis-view-toggle"]');
      expect(liveToggle?.className).toContain('justify-center');
      expect(liveToggle?.querySelector('[role="group"]')).not.toBeNull();
      expect(liveToggle?.textContent).toContain('Fitness');
      expect(liveToggle?.textContent).toContain('Telemetry');
    } finally {
      // WHY unmount before locale restore: changeLanguage notifies live subscribers and must not race act().
      if (root) {
        const mounted = root;
        act(() => {
          mounted.unmount();
        });
        root = undefined;
      }
      container?.remove();
      container = undefined;
      await act(async () => {
        await i18n.changeLanguage('zh-Hant');
      });
    }
  });

  it('switches to telemetry lexicon, persists mode, and arms charge + sheen ritual', async () => {
    const { hapticService } = await import('../../../services/hapticService');
    renderBoard();

    // WHY scope to live toggle: keeps the interaction contract pinned to the dedicated toggle row.
    const liveToggle = container!.querySelector('[data-testid="console-axis-view-toggle"]');
    const telemetryBtn = Array.from(liveToggle?.querySelectorAll('button') ?? []).find(
      (btn) => btn.textContent === '遙測'
    );
    expect(telemetryBtn).toBeTruthy();

    act(() => {
      telemetryBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await act(async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    });

    expect(container!.textContent).toContain('整車馬力 // HP');
    expect(container!.textContent).toContain('瞬態扭矩 // TRQ');
    expect(container!.textContent).toContain('整車性能指數');
    expect(container!.textContent).not.toContain('綜合戰力指數');
    expect(container!.querySelector('[data-testid="radar"]')?.textContent).toContain('馬力');
    expect(memory.get(CONSOLE_AXIS_VIEW_MODE_STORAGE_KEY)).toBe('telemetry');
    expect(hapticService.triggerContinuousSoft).toHaveBeenCalled();

    const stage = container!.querySelector('.ui-console-radar-stage');
    expect(stage?.getAttribute('data-console-mode')).toBe('telemetry');
    expect(stage?.className).toContain('is-surging');
    expect(container!.querySelector('.ui-console-radar-pulse')?.className).toContain('is-pulsing');
    expect(container!.querySelector('.ui-console-rev-up')?.className).toContain('is-revving');
    const sheenHosts = container!.querySelectorAll('.is-surging > .ui-console-sheen-layer');
    expect(sheenHosts.length).toBeGreaterThanOrEqual(3);
  });
});
