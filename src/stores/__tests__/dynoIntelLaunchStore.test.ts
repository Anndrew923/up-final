import { describe, expect, it, beforeEach } from 'vitest';
import { useDynoIntelLaunchStore } from '../dynoIntelLaunchStore';

describe('useDynoIntelLaunchStore', () => {
  beforeEach(() => {
    useDynoIntelLaunchStore.setState({ pendingPrompt: null, requestId: 0 });
  });

  it('queues a trimmed prompt and bumps requestId', () => {
    useDynoIntelLaunchStore.getState().requestLaunch('  decode me  ');
    const state = useDynoIntelLaunchStore.getState();
    expect(state.pendingPrompt).toBe('decode me');
    expect(state.requestId).toBe(1);

    useDynoIntelLaunchStore.getState().requestLaunch('decode me');
    expect(useDynoIntelLaunchStore.getState().requestId).toBe(2);
  });

  it('ignores blank prompts', () => {
    useDynoIntelLaunchStore.getState().requestLaunch('   ');
    expect(useDynoIntelLaunchStore.getState()).toMatchObject({
      pendingPrompt: null,
      requestId: 0,
    });
  });

  it('clears pending without resetting requestId history', () => {
    useDynoIntelLaunchStore.getState().requestLaunch('keep token');
    useDynoIntelLaunchStore.getState().clearPending();
    expect(useDynoIntelLaunchStore.getState()).toMatchObject({
      pendingPrompt: null,
      requestId: 1,
    });
  });
});
