/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CONSOLE_SYNC_ARRIVAL_FILL_MS,
  CONSOLE_SYNC_ARRIVAL_TOAST_FADE_MS,
  CONSOLE_SYNC_ARRIVAL_TOAST_HOLD_MS,
  useConsoleSyncArrival,
} from '../useConsoleSyncArrival';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const motionMocks = vi.hoisted(() => ({
  prefersReducedMotion: vi.fn(() => true),
}));

const animateToMock = vi.hoisted(() => vi.fn(async () => undefined));
const setInstantMock = vi.hoisted(() => vi.fn());
const capturedDuration = vi.hoisted(() => ({ current: 0 }));

vi.mock('../../lib/motionPreference', () => ({
  prefersReducedMotion: motionMocks.prefersReducedMotion,
}));

vi.mock('../useAnimatedScore', () => ({
  useAnimatedScore: (options: { durationMs?: number }) => {
    capturedDuration.current = options.durationMs ?? 0;
    return {
      displayValue: 12.5,
      isAnimating: false,
      animateTo: animateToMock,
      cancel: vi.fn(),
      setInstant: setInstantMock,
    };
  },
}));

function renderArrivalHook(
  overallScore: number,
  arrivalPulse: number,
  radarInstanceKey = 'fitness'
): {
  read: () => ReturnType<typeof useConsoleSyncArrival>;
  rerender: (nextScore: number, nextPulse: number, nextKey?: string) => void;
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const latestRef: { current: ReturnType<typeof useConsoleSyncArrival> | null } = {
    current: null,
  };

  function Harness({
    score,
    pulse,
    radarInstanceKey,
  }: {
    score: number;
    pulse: number;
    radarInstanceKey: string;
  }) {
    latestRef.current = useConsoleSyncArrival({
      overallScore: score,
      arrivalPulse: pulse,
      radarInstanceKey,
    });
    return null;
  }

  act(() => {
    root.render(
      <Harness score={overallScore} pulse={arrivalPulse} radarInstanceKey={radarInstanceKey} />
    );
  });

  return {
    read: () => {
      if (!latestRef.current) {
        throw new Error('useConsoleSyncArrival harness not ready');
      }
      return latestRef.current;
    },
    rerender: (nextScore, nextPulse, nextKey = radarInstanceKey) => {
      act(() => {
        root.render(
          <Harness score={nextScore} pulse={nextPulse} radarInstanceKey={nextKey} />
        );
      });
    },
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe('useConsoleSyncArrival', () => {
  beforeEach(() => {
    motionMocks.prefersReducedMotion.mockReturnValue(true);
    animateToMock.mockClear();
    setInstantMock.mockClear();
    capturedDuration.current = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stays idle at full fill when no pulse has fired', () => {
    const harness = renderArrivalHook(60.55, 0);
    expect(capturedDuration.current).toBe(CONSOLE_SYNC_ARRIVAL_FILL_MS);
    expect(harness.read().radarFill).toBe(1);
    expect(harness.read().suppressRadarEntryAnimation).toBe(false);
    expect(harness.read().toastVisible).toBe(false);
    expect(harness.read().displayScore).toBe(60.55);
    expect(animateToMock).not.toHaveBeenCalled();
    harness.unmount();
  });

  it('fills instantly, ticks score, and shows a toast on reduced-motion pulse', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const harness = renderArrivalHook(60.55, 0);
    harness.rerender(60.55, 1);

    expect(harness.read().radarFill).toBe(1);
    expect(harness.read().suppressRadarEntryAnimation).toBe(true);
    expect(harness.read().toastVisible).toBe(true);
    expect(harness.read().toastFading).toBe(false);
    expect(setInstantMock).toHaveBeenCalledWith(60.55);
    expect(animateToMock).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(CONSOLE_SYNC_ARRIVAL_TOAST_HOLD_MS);
    });
    expect(harness.read().toastFading).toBe(true);
    expect(harness.read().toastVisible).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(CONSOLE_SYNC_ARRIVAL_TOAST_FADE_MS);
    });
    expect(harness.read().toastVisible).toBe(false);
    harness.unmount();
  });

  it('starts radar fill at 0 and animates score from 0 when motion is allowed', () => {
    motionMocks.prefersReducedMotion.mockReturnValue(false);
    const harness = renderArrivalHook(81.23, 0);
    harness.rerender(81.23, 1);

    expect(harness.read().radarFill).toBe(0);
    expect(harness.read().suppressRadarEntryAnimation).toBe(true);
    expect(harness.read().toastVisible).toBe(true);
    expect(animateToMock).toHaveBeenCalledWith(81.23, 0);
    harness.unmount();
  });

  it('releases stroke-draw suppression when the radar instance key changes', () => {
    const harness = renderArrivalHook(60.55, 0);
    harness.rerender(60.55, 1);
    expect(harness.read().suppressRadarEntryAnimation).toBe(true);

    harness.rerender(60.55, 1, 'telemetry');
    expect(harness.read().suppressRadarEntryAnimation).toBe(false);
    harness.unmount();
  });
});
