/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { triggerNavTabTick, useNavSensoryFeedback } from '../useNavSensoryFeedback';
import { useTabRouteTransitionStore } from '../../stores/tabRouteTransitionStore';

const { triggerNavTabSensory } = vi.hoisted(() => ({
  triggerNavTabSensory: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../services/hapticService', () => ({
  hapticService: {
    triggerNavTabSensory,
  },
}));

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function renderSensoryHarness(): { unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);

  function Harness() {
    useNavSensoryFeedback();
    return null;
  }

  act(() => {
    root.render(<Harness />);
  });

  return {
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('useNavSensoryFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTabRouteTransitionStore.setState({ phase: 'idle', generation: 0 });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('fires ack once per settle generation from the central clock', () => {
    const harness = renderSensoryHarness();

    act(() => {
      useTabRouteTransitionStore.getState().startSprint();
      useTabRouteTransitionStore.getState().completeSettle();
    });

    expect(triggerNavTabSensory).toHaveBeenCalledTimes(1);
    expect(triggerNavTabSensory).toHaveBeenCalledWith('ack');

    act(() => {
      useTabRouteTransitionStore.getState().completeSettle();
    });
    expect(triggerNavTabSensory).toHaveBeenCalledTimes(1);

    act(() => {
      useTabRouteTransitionStore.getState().startSprint();
      useTabRouteTransitionStore.getState().completeSettle();
    });
    expect(triggerNavTabSensory).toHaveBeenCalledTimes(2);

    harness.unmount();
  });

  it('fires tick immediately from BottomNav press helper', () => {
    triggerNavTabTick();
    expect(triggerNavTabSensory).toHaveBeenCalledTimes(1);
    expect(triggerNavTabSensory).toHaveBeenCalledWith('tick');
  });
});
