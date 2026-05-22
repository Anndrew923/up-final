/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exitIfRunCancelled, useHomeResonanceRitual } from '../useHomeResonanceRitual';
import type { UseHomeResonanceRitualInput } from '../useHomeResonanceRitual';
import { useBootSequenceStore } from '../../stores/bootSequenceStore';
import { useUiInteractionStore } from '../../stores/uiInteractionStore';
import {
  markPendingRadarResonance,
  clearPendingRadarResonance,
} from '../../services/radarResonanceSession';
import type { RadarChartPoint } from '../../types/radarDisplay';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const motionMocks = vi.hoisted(() => ({
  prefersReducedMotion: vi.fn(() => true),
}));

const animateToMock = vi.hoisted(() => vi.fn(async () => undefined));
const playTypewriterMock = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock('../../lib/motionPreference', () => ({
  prefersReducedMotion: motionMocks.prefersReducedMotion,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../useAnimatedScore', () => ({
  useAnimatedScore: () => ({
    displayValue: 72,
    animateTo: animateToMock,
    cancel: vi.fn(),
    setInstant: vi.fn(),
  }),
}));

vi.mock('../useDopamineFeedback', () => ({
  useDopamineFeedback: () => ({
    triggerImpact: vi.fn(),
    triggerRankUpCombo: vi.fn(),
  }),
}));

vi.mock('../useTypewriterText', () => ({
  useTypewriterText: () => ({
    visibleText: 'grade-line',
    play: playTypewriterMock,
    reset: vi.fn(),
    cancel: vi.fn(),
  }),
}));

const defaultInput: UseHomeResonanceRitualInput = {
  overallScore: 72,
  radarPoints: [
    { key: 'strength', value: 80, label: 'HP' },
    { key: 'explosivePower', value: 70, label: 'TRQ' },
    { key: 'cardio', value: 60, label: 'STINT' },
    { key: 'muscleMass', value: 65, label: 'CHSS' },
    { key: 'bodyFat', value: 55, label: 'P2W' },
    { key: 'gripStrength', value: 90, label: 'GRIP' },
  ] as RadarChartPoint[],
  vehicleClassId: 'WIDE_BODY',
  genderGroup: 'male',
};

function renderRitualHook(input: UseHomeResonanceRitualInput = defaultInput): {
  read: () => ReturnType<typeof useHomeResonanceRitual>;
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const latestRef: { current: ReturnType<typeof useHomeResonanceRitual> | null } = {
    current: null,
  };

  function Harness() {
    latestRef.current = useHomeResonanceRitual(input);
    return null;
  }

  act(() => {
    root.render(<Harness />);
  });

  return {
    read: () => {
      if (!latestRef.current) {
        throw new Error('useHomeResonanceRitual harness not ready');
      }
      return latestRef.current;
    },
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe('exitIfRunCancelled', () => {
  it('returns false while the run still owns the timeline', () => {
    const runIdRef = { current: 3 };
    const close = vi.fn();
    expect(exitIfRunCancelled(3, runIdRef, close)).toBe(false);
    expect(close).not.toHaveBeenCalled();
  });

  it('returns true without closing when a newer startRitual superseded this run', () => {
    const runIdRef = { current: 4 };
    const close = vi.fn();
    expect(exitIfRunCancelled(3, runIdRef, close)).toBe(true);
    expect(close).not.toHaveBeenCalled();
  });

  it('closes the overlay when this run was cancelled without a superseding run', () => {
    const runIdRef = { current: 2 };
    const close = vi.fn();
    expect(exitIfRunCancelled(3, runIdRef, close)).toBe(true);
    expect(close).toHaveBeenCalledOnce();
  });
});

describe('useHomeResonanceRitual', () => {
  beforeEach(() => {
    motionMocks.prefersReducedMotion.mockReturnValue(true);
    animateToMock.mockImplementation(async () => undefined);
    playTypewriterMock.mockImplementation(async () => undefined);
    clearPendingRadarResonance();
    useBootSequenceStore.setState({ completed: true });
    useUiInteractionStore.setState({
      isHomeResonanceBlocking: false,
      isBootSequenceBlocking: false,
      bootSequencePhase: 0,
      bootSequenceVariant: 'none',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    clearPendingRadarResonance();
  });

  it('completes reduced-motion ritual to report phase', async () => {
    const harness = renderRitualHook();

    await act(async () => {
      await harness.read().startRitual();
    });

    expect(harness.read().open).toBe(true);
    expect(harness.read().phase).toBe('report');
    expect(harness.read().snapshot).not.toBeNull();
    expect(useUiInteractionStore.getState().isHomeResonanceBlocking).toBe(true);

    harness.unmount();
    expect(useUiInteractionStore.getState().isHomeResonanceBlocking).toBe(false);
  });

  it('does not leave a zombie when a second startRitual supersedes the first mid-run', async () => {
    let resolveFirstAnimate: (() => void) | undefined;
    animateToMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveFirstAnimate = resolve;
        })
    );

    const harness = renderRitualHook();

    let firstRun: Promise<void> | undefined;
    await act(async () => {
      firstRun = harness.read().startRitual();
    });

    expect(harness.read().open).toBe(true);
    expect(harness.read().phase).toBe('count');

    await act(async () => {
      await harness.read().startRitual();
    });

    await act(async () => {
      resolveFirstAnimate?.();
      await firstRun;
    });

    expect(harness.read().open).toBe(true);
    expect(harness.read().phase).toBe('report');
    expect(harness.read().showBootScore).toBe(false);
    harness.unmount();
  });

  it('clears shell blocking on unmount while ritual is in flight', async () => {
    animateToMock.mockImplementationOnce(
      () =>
        new Promise<void>(() => {
          /* never resolves — simulates in-flight ritual */
        })
    );

    const harness = renderRitualHook();

    await act(async () => {
      void harness.read().startRitual();
    });

    expect(harness.read().open).toBe(true);
    expect(useUiInteractionStore.getState().isHomeResonanceBlocking).toBe(true);

    harness.unmount();

    expect(useUiInteractionStore.getState().isHomeResonanceBlocking).toBe(false);
  });

  it('auto-starts when boot is complete and pending resonance flag is set', async () => {
    markPendingRadarResonance();
    const harness = renderRitualHook();

    await act(async () => {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 0);
      });
    });

    expect(harness.read().open).toBe(true);
    expect(harness.read().phase).toBe('report');
    harness.unmount();
  });

  it('closeRitual resets open state and shell blocking', async () => {
    const harness = renderRitualHook();

    await act(async () => {
      await harness.read().startRitual();
    });

    act(() => {
      harness.read().closeRitual();
    });

    expect(harness.read().open).toBe(false);
    expect(harness.read().phase).toBe('idle');
    expect(harness.read().snapshot).toBeNull();
    expect(useUiInteractionStore.getState().isHomeResonanceBlocking).toBe(false);
    harness.unmount();
  });
});
