/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CERT_REVEAL_MS } from '../../lib/certRevealMotion';
import { useAestheticCertReveal } from '../useAestheticCertReveal';
import type { UseAestheticCertRevealResult } from '../useAestheticCertReveal';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const motionMocks = vi.hoisted(() => ({
  prefersReducedMotion: vi.fn(() => false),
}));

vi.mock('../../lib/motionPreference', () => ({
  prefersReducedMotion: motionMocks.prefersReducedMotion,
}));

function renderRevealHook(): {
  read: () => UseAestheticCertRevealResult;
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let latest: UseAestheticCertRevealResult = {
    phase: 'revealing',
    skip: () => undefined,
  };

  function Harness() {
    latest = useAestheticCertReveal();
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

describe('useAestheticCertReveal', () => {
  beforeEach(() => {
    motionMocks.prefersReducedMotion.mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts revealing and settles to done after CERT_REVEAL_MS', () => {
    vi.useFakeTimers();
    const harness = renderRevealHook();
    expect(harness.read().phase).toBe('revealing');

    act(() => {
      vi.advanceTimersByTime(CERT_REVEAL_MS - 1);
    });
    expect(harness.read().phase).toBe('revealing');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(harness.read().phase).toBe('done');
    harness.unmount();
  });

  it('skip() jumps to done before the timeout', () => {
    vi.useFakeTimers();
    const harness = renderRevealHook();
    expect(harness.read().phase).toBe('revealing');

    act(() => {
      harness.read().skip();
    });
    expect(harness.read().phase).toBe('done');

    act(() => {
      vi.advanceTimersByTime(CERT_REVEAL_MS);
    });
    expect(harness.read().phase).toBe('done');
    harness.unmount();
  });

  it('starts done when prefers-reduced-motion is set', () => {
    motionMocks.prefersReducedMotion.mockReturnValue(true);
    const harness = renderRevealHook();
    expect(harness.read().phase).toBe('done');
    harness.unmount();
  });
});
