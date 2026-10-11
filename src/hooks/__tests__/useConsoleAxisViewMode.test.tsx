/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONSOLE_S_MODE_CHARGE_SOFT_MS } from '../../logic/core/consoleSModeRitual';
import { CONSOLE_AXIS_VIEW_MODE_STORAGE_KEY } from '../../services/localStorageService';
import { useConsoleAxisViewMode } from '../useConsoleAxisViewMode';

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

vi.mock('../../services/hapticService', () => ({
  hapticService: {
    trigger: vi.fn(),
    triggerContinuousSoft: vi.fn(),
    stopContinuousSoft: vi.fn(),
  },
}));

describe('useConsoleAxisViewMode', () => {
  let container: HTMLDivElement | undefined;
  let root: Root | undefined;
  let latest: ReturnType<typeof useConsoleAxisViewMode> | null = null;

  beforeEach(async () => {
    memory.clear();
    latest = null;
    vi.useFakeTimers();
    const { hapticService } = await import('../../services/hapticService');
    vi.mocked(hapticService.trigger).mockClear();
    vi.mocked(hapticService.triggerContinuousSoft).mockClear();
    vi.mocked(hapticService.stopContinuousSoft).mockClear();
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
    vi.useRealTimers();
  });

  function mount(): void {
    container = document.createElement('div');
    document.body.appendChild(container);
    const nextRoot = createRoot(container);
    root = nextRoot;

    function Harness() {
      latest = useConsoleAxisViewMode();
      return null;
    }

    act(() => {
      nextRoot.render(<Harness />);
    });
  }

  it('charges soft then bites Heavy when entering telemetry', async () => {
    const { hapticService } = await import('../../services/hapticService');
    mount();
    expect(latest?.viewMode).toBe('fitness');

    act(() => {
      latest?.setViewMode('telemetry');
    });

    expect(latest?.viewMode).toBe('telemetry');
    expect(memory.get(CONSOLE_AXIS_VIEW_MODE_STORAGE_KEY)).toBe('telemetry');
    expect(hapticService.triggerContinuousSoft).toHaveBeenCalledWith(CONSOLE_S_MODE_CHARGE_SOFT_MS);
    expect(hapticService.trigger).not.toHaveBeenCalledWith('climax');

    act(() => {
      vi.advanceTimersByTime(CONSOLE_S_MODE_CHARGE_SOFT_MS);
    });

    expect(hapticService.trigger).toHaveBeenCalledWith('climax');
  });

  it('uses medium settle haptic when returning to fitness', async () => {
    const { hapticService } = await import('../../services/hapticService');
    memory.set(CONSOLE_AXIS_VIEW_MODE_STORAGE_KEY, 'telemetry');
    mount();
    expect(latest?.viewMode).toBe('telemetry');

    act(() => {
      latest?.setViewMode('fitness');
    });

    expect(latest?.viewMode).toBe('fitness');
    expect(hapticService.trigger).toHaveBeenCalledWith('milestone');
    expect(hapticService.triggerContinuousSoft).not.toHaveBeenCalled();
    expect(hapticService.stopContinuousSoft).toHaveBeenCalled();
  });
});
