/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ROUTES } from '../../config/routes';
import {
  clearPendingRadarResonance,
  hasPendingRadarResonance,
  markPendingRadarResonance,
} from '../../services/radarResonanceSession';
import { useBootSequenceStore } from '../../stores/bootSequenceStore';
import { useConsoleArrivalPulse } from '../useConsoleArrivalPulse';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: ROUTES.home }),
}));

function renderPulseHook(): {
  read: () => number;
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const latestRef: { current: number | null } = { current: null };

  function Harness() {
    latestRef.current = useConsoleArrivalPulse();
    return null;
  }

  act(() => {
    root.render(<Harness />);
  });

  return {
    read: () => {
      if (latestRef.current == null) {
        throw new Error('useConsoleArrivalPulse harness not ready');
      }
      return latestRef.current;
    },
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe('useConsoleArrivalPulse', () => {
  beforeEach(() => {
    clearPendingRadarResonance();
    useBootSequenceStore.setState({ completed: true });
  });

  afterEach(() => {
    clearPendingRadarResonance();
  });

  it('stays idle when no pending flag is set', () => {
    const harness = renderPulseHook();
    expect(harness.read()).toBe(0);
    harness.unmount();
  });

  it('claims pending into a pulse without leaving the session flag', () => {
    markPendingRadarResonance();
    const harness = renderPulseHook();
    expect(harness.read()).toBeGreaterThan(0);
    expect(hasPendingRadarResonance()).toBe(false);
    harness.unmount();
  });

  it('defers claiming until boot completes', () => {
    useBootSequenceStore.setState({ completed: false });
    markPendingRadarResonance();
    const harness = renderPulseHook();

    expect(harness.read()).toBe(0);
    expect(hasPendingRadarResonance()).toBe(true);

    act(() => {
      useBootSequenceStore.setState({ completed: true });
    });

    expect(harness.read()).toBeGreaterThan(0);
    expect(hasPendingRadarResonance()).toBe(false);
    harness.unmount();
  });
});
