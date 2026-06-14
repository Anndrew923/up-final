import { beforeEach, describe, expect, it } from 'vitest';
import { useTabRouteTransitionStore } from '../tabRouteTransitionStore';

describe('tabRouteTransitionStore', () => {
  beforeEach(() => {
    useTabRouteTransitionStore.setState({ phase: 'idle', generation: 0 });
  });

  it('starts sprint with a new generation', () => {
    useTabRouteTransitionStore.getState().startSprint();
    expect(useTabRouteTransitionStore.getState()).toMatchObject({
      phase: 'sprint',
      generation: 1,
    });
  });

  it('moves sprint to settle on central clock completion', () => {
    useTabRouteTransitionStore.getState().startSprint();
    useTabRouteTransitionStore.getState().completeSettle();
    expect(useTabRouteTransitionStore.getState()).toMatchObject({
      phase: 'settle',
      generation: 1,
    });
  });

  it('returns to idle on finish or cancel without bumping generation', () => {
    useTabRouteTransitionStore.getState().startSprint();
    useTabRouteTransitionStore.getState().completeSettle();
    useTabRouteTransitionStore.getState().finish();
    expect(useTabRouteTransitionStore.getState()).toMatchObject({
      phase: 'idle',
      generation: 1,
    });

    useTabRouteTransitionStore.getState().startSprint();
    useTabRouteTransitionStore.getState().cancel();
    expect(useTabRouteTransitionStore.getState()).toMatchObject({
      phase: 'idle',
      generation: 2,
    });
  });
});
