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

const ritualState = vi.hoisted(() => ({
  arrivalPulse: 0,
  startRitual: vi.fn(),
}));

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

vi.mock('../../../lib/motionPreference', () => ({
  prefersReducedMotion: () => true,
  usePrefersReducedMotion: () => true,
}));

vi.mock('../../../hooks/useCoreSixRadar', () => ({
  useCoreSixRadar: () => ({
    radarPoints: [
      { key: 'strength', value: 71.4, label: '最大肌力' },
      { key: 'explosivePower', value: 80, label: '爆發力' },
      { key: 'cardio', value: 90, label: '心肺耐力' },
      { key: 'muscleMass', value: 70, label: '骨骼肌量' },
      { key: 'bodyFat', value: 85, label: 'FFMI' },
      { key: 'gripStrength', value: 91, label: '握力' },
    ],
    overallScore: 60.55,
    scaleMax: 120,
  }),
}));

vi.mock('../../../hooks/useConsoleArrivalPulse', () => ({
  useConsoleArrivalPulse: () => ritualState.arrivalPulse,
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
    startRitual: ritualState.startRitual,
    closeRitual: vi.fn(),
  }),
}));

vi.mock('../../../stores/uiInteractionStore', () => ({
  useShellInteractionBlocked: () => false,
}));

vi.mock('../../ladder/LeaderboardSyncAllBar', () => ({
  default: () => <div data-testid="sync-bar" />,
}));

vi.mock('../HomeResonanceOverlay', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="resonance-overlay" /> : null,
}));

vi.mock('../../aesthetic/AestheticSpecModal', () => ({
  default: () => <div data-testid="aesthetic-spec-modal" />,
}));

vi.mock('../../radar/HexRadarChart', () => ({
  default: ({
    ritualFill,
    suppressEntryAnimation,
  }: {
    ritualFill?: number;
    suppressEntryAnimation?: boolean;
  }) => (
    <div
      data-testid="radar"
      data-ritual-fill={ritualFill ?? 1}
      data-suppress={suppressEntryAnimation ? '1' : '0'}
    />
  ),
}));

vi.mock('../../../services/hapticService', () => ({
  hapticService: {
    trigger: vi.fn(),
    triggerContinuousSoft: vi.fn(),
    stopContinuousSoft: vi.fn(),
  },
}));

describe('HomeRadarBoard sync arrival', () => {
  let container: HTMLDivElement | undefined;
  let root: Root | undefined;

  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  beforeEach(() => {
    ritualState.arrivalPulse = 0;
    ritualState.startRitual.mockClear();
    memory.clear();
    memory.delete(CONSOLE_AXIS_VIEW_MODE_STORAGE_KEY);
  });

  afterEach(() => {
    if (root) {
      const mounted = root;
      act(() => {
        mounted.unmount();
      });
    }
    container?.remove();
    root = undefined;
    container = undefined;
  });

  function renderBoard(): void {
    if (!container) {
      container = document.createElement('div');
      document.body.appendChild(container);
    }
    if (!root) {
      root = createRoot(container);
    }
    act(() => {
      root!.render(
        <I18nextProvider i18n={i18n}>
          <MemoryRouter>
            <HomeRadarBoard />
          </MemoryRouter>
        </I18nextProvider>
      );
    });
  }

  it('does not open the spec certificate until the fitness CTA is clicked', () => {
    renderBoard();
    expect(document.querySelector('[data-testid="aesthetic-spec-modal"]')).toBeNull();
    expect(document.querySelector('[data-testid="resonance-overlay"]')).toBeNull();

    const trigger = container!.querySelector(
      '[data-testid="aesthetic-spec-trigger"]'
    ) as HTMLButtonElement | null;
    expect(trigger).not.toBeNull();

    act(() => {
      trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(document.querySelector('[data-testid="aesthetic-spec-modal"]')).not.toBeNull();
  });

  it('plays radar fill, score ticker, and a non-blocking toast on arrival pulse', () => {
    renderBoard();
    expect(document.querySelector('[data-testid="console-sync-arrival-toast"]')).toBeNull();
    expect(container!.querySelector('[data-testid="radar"]')?.getAttribute('data-ritual-fill')).toBe(
      '1'
    );
    expect(container!.textContent).toContain('60.55');

    ritualState.arrivalPulse = 1;
    renderBoard();

    const toast = document.querySelector('[data-testid="console-sync-arrival-toast"]');
    expect(toast).not.toBeNull();
    expect(toast?.getAttribute('role')).toBe('status');
    expect(toast?.className).toContain('pointer-events-none');
    expect(toast?.textContent).toContain('數據已同步 // 主控台已更新');
    expect(container!.querySelector('[data-testid="radar"]')?.getAttribute('data-ritual-fill')).toBe(
      '1'
    );
    expect(container!.querySelector('[data-testid="radar"]')?.getAttribute('data-suppress')).toBe(
      '1'
    );
    expect(container!.textContent).toContain('60.55');
    expect(document.querySelector('[data-testid="aesthetic-spec-modal"]')).toBeNull();
    expect(document.querySelector('[data-testid="resonance-overlay"]')).toBeNull();
  });

  it('keeps telemetry diagnostics as a manual ritual start', async () => {
    renderBoard();
    const liveToggle = container!.querySelector('[data-testid="console-axis-view-toggle"]');
    const telemetryBtn = Array.from(liveToggle?.querySelectorAll('button') ?? []).find(
      (btn) => btn.textContent === '遙測'
    );
    expect(telemetryBtn).toBeTruthy();

    act(() => {
      telemetryBtn?.click();
    });

    await act(async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    });

    const diagnostics = container!.querySelector(
      '[data-testid="diagnostics"]'
    ) as HTMLButtonElement | null;
    expect(diagnostics).not.toBeNull();

    act(() => {
      diagnostics?.click();
    });

    expect(ritualState.startRitual).toHaveBeenCalledTimes(1);
  });
});
