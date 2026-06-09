/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CEREMONY_MS_MAX,
  useAssessmentCeremony,
  type UseAssessmentCeremonyResult,
} from '../useAssessmentCeremony';

const triggerChargeRitual = vi.fn();
const stopChargeRitual = vi.fn();

vi.mock('../useDopamineFeedback', () => ({
  useDopamineFeedback: () => ({
    triggerChargeRitual,
    stopChargeRitual,
    triggerRankUpCombo: vi.fn(),
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { returnObjects?: boolean }) => {
      if (key === 'assessment.ceremony.scanning') return 'Scanning…';
      if (key === 'assessment.ceremony.overlayAria') return 'Diagnostic overlay';
      if (key === 'assessment.ceremony.messages.strength' && options?.returnObjects) {
        return { m0: 'Line A', m1: 'Line B', m2: 'Line C' };
      }
      return key;
    },
  }),
}));

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function renderHookHarness(): {
  getCurrent: () => UseAssessmentCeremonyResult | null;
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let latest: UseAssessmentCeremonyResult | null = null;

  function Harness() {
    latest = useAssessmentCeremony({ pool: 'strength' });
    return null;
  }

  act(() => {
    root.render(<Harness />);
  });

  return {
    getCurrent: () => latest,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('useAssessmentCeremony', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    triggerChargeRitual.mockReset();
    stopChargeRitual.mockReset();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('runs compute after ceremony duration and fires haptics on schedule', async () => {
    const run = vi.fn();
    const harness = renderHookHarness();

    let promise: Promise<void> | undefined;
    act(() => {
      promise = harness.getCurrent()!.wrapCalculate(run);
    });

    expect(harness.getCurrent()!.isActive).toBe(true);
    expect(run).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(triggerChargeRitual).toHaveBeenCalledWith(1350);

    act(() => {
      vi.advanceTimersByTime(CEREMONY_MS_MAX);
    });

    await act(async () => {
      await promise;
    });

    expect(run).toHaveBeenCalledTimes(1);
    expect(harness.getCurrent()!.isActive).toBe(false);
    expect(triggerChargeRitual).toHaveBeenCalledTimes(1);
    expect(stopChargeRitual).toHaveBeenCalled();

    harness.unmount();
  });

  it('ignores duplicate wrapCalculate while active', () => {
    const run = vi.fn();
    const harness = renderHookHarness();

    act(() => {
      void harness.getCurrent()!.wrapCalculate(run);
      void harness.getCurrent()!.wrapCalculate(run);
    });

    act(() => {
      vi.advanceTimersByTime(CEREMONY_MS_MAX);
    });

    expect(run).toHaveBeenCalledTimes(1);
    harness.unmount();
  });

  it('short-circuits ceremony when prefers-reduced-motion', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('reduce'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    const run = vi.fn();
    const harness = renderHookHarness();

    let promise: Promise<void> | undefined;
    act(() => {
      promise = harness.getCurrent()!.wrapCalculate(run);
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    await act(async () => {
      await promise;
    });

    expect(run).toHaveBeenCalledTimes(1);
    expect(triggerChargeRitual).toHaveBeenCalledTimes(1);
    expect(triggerChargeRitual).toHaveBeenCalledWith(400);

    harness.unmount();
  });

  it('cancel resolves without running compute', async () => {
    const run = vi.fn();
    const harness = renderHookHarness();

    let promise: Promise<void> | undefined;
    act(() => {
      promise = harness.getCurrent()!.wrapCalculate(run);
    });

    act(() => {
      harness.getCurrent()!.cancel();
    });

    await act(async () => {
      await promise;
    });

    expect(run).not.toHaveBeenCalled();
    expect(harness.getCurrent()!.isActive).toBe(false);
    expect(stopChargeRitual).toHaveBeenCalled();
    harness.unmount();
  });

  it('rejects when compute throws after ceremony', async () => {
    const harness = renderHookHarness();
    const boom = new Error('compute failed');

    let promise: Promise<void> | undefined;
    act(() => {
      promise = harness.getCurrent()!.wrapCalculate(() => {
        throw boom;
      });
    });

    act(() => {
      vi.advanceTimersByTime(CEREMONY_MS_MAX);
    });

    await act(async () => {
      await expect(promise).rejects.toThrow('compute failed');
    });

    expect(harness.getCurrent()!.isActive).toBe(false);
    expect(stopChargeRitual).toHaveBeenCalled();
    harness.unmount();
  });
});
