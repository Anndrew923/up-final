/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearAndroidBackDismissStack, tryDismissTopAndroidBackOverlay } from '../../lib/androidBackDismissStack';
import { useAndroidBackDismiss } from '../useAndroidBackDismiss';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function OverlayProbe({
  active,
  onDismiss,
}: {
  active: boolean;
  onDismiss: () => void;
}) {
  useAndroidBackDismiss(active, onDismiss);
  return null;
}

function renderProbe(active: boolean, onDismiss: () => void) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const render = (nextActive: boolean, nextDismiss: () => void = onDismiss) => {
    act(() => {
      root.render(<OverlayProbe active={nextActive} onDismiss={nextDismiss} />);
    });
  };
  render(active, onDismiss);
  return {
    setActive: (nextActive: boolean) => render(nextActive, onDismiss),
    setHandler: (nextDismiss: () => void) => {
      onDismiss = nextDismiss;
      render(active, nextDismiss);
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

afterEach(() => {
  clearAndroidBackDismissStack();
  document.body.innerHTML = '';
});

describe('useAndroidBackDismiss', () => {
  it('claims hardware back only while the overlay is open', () => {
    const onDismiss = vi.fn();
    const probe = renderProbe(true, onDismiss);

    expect(tryDismissTopAndroidBackOverlay()).toBe(true);
    expect(onDismiss).toHaveBeenCalledTimes(1);

    probe.setActive(false);
    expect(tryDismissTopAndroidBackOverlay()).toBe(false);

    probe.unmount();
  });

  it('uses the latest dismiss callback without dropping the registration', () => {
    const first = vi.fn();
    const second = vi.fn();
    const probe = renderProbe(true, first);

    probe.setHandler(second);
    expect(tryDismissTopAndroidBackOverlay()).toBe(true);
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();

    probe.unmount();
  });

  it('lets the latest open overlay win, then falls through when it closes', () => {
    const closeFilter = vi.fn();
    const closeOption = vi.fn();
    const filter = renderProbe(true, closeFilter);
    const option = renderProbe(true, closeOption);

    expect(tryDismissTopAndroidBackOverlay()).toBe(true);
    expect(closeOption).toHaveBeenCalledTimes(1);
    expect(closeFilter).not.toHaveBeenCalled();

    option.setActive(false);
    expect(tryDismissTopAndroidBackOverlay()).toBe(true);
    expect(closeFilter).toHaveBeenCalledTimes(1);

    filter.unmount();
    option.unmount();
  });
});
