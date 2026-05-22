/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDiagnosticsReportEntrance } from '../useDiagnosticsReportEntrance';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const motionMocks = vi.hoisted(() => ({
  prefersReducedMotion: vi.fn(() => false),
}));

vi.mock('../../lib/motionPreference', () => ({
  prefersReducedMotion: motionMocks.prefersReducedMotion,
}));

function renderEntranceHook(): {
  read: () => ReturnType<typeof useDiagnosticsReportEntrance>;
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let latest = { entered: false, motionActive: true };

  function Harness() {
    latest = useDiagnosticsReportEntrance();
    return null;
  }

  act(() => {
    root.render(<Harness />);
  });

  return {
    read: () => latest,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe('useDiagnosticsReportEntrance', () => {
  beforeEach(() => {
    motionMocks.prefersReducedMotion.mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('enters on the next animation frame when motion is allowed', async () => {
    vi.useRealTimers();
    const harness = renderEntranceHook();
    expect(harness.read().entered).toBe(false);

    await act(async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    });

    expect(harness.read().entered).toBe(true);
    expect(harness.read().motionActive).toBe(true);
    harness.unmount();
  });

  it('starts visible and idle when reduced motion is preferred', () => {
    motionMocks.prefersReducedMotion.mockReturnValue(true);
    const harness = renderEntranceHook();
    expect(harness.read().entered).toBe(true);
    expect(harness.read().motionActive).toBe(false);
    harness.unmount();
  });

  it('clears motionActive after entrance duration', () => {
    vi.useFakeTimers();
    const harness = renderEntranceHook();

    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(harness.read().motionActive).toBe(false);
    harness.unmount();
  });
});
