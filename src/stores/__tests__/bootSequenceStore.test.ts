import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as localStorageService from '../../services/localStorageService';
import { useBootSequenceStore } from '../bootSequenceStore';

describe('bootSequenceStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useBootSequenceStore.setState({ completed: false });
  });

  it('completeBoot persists and updates state', () => {
    const saveSpy = vi.spyOn(localStorageService, 'saveBootSequenceCompleted');
    useBootSequenceStore.getState().completeBoot();
    expect(useBootSequenceStore.getState().completed).toBe(true);
    expect(saveSpy).toHaveBeenCalledWith(true);
  });

  it('resetBoot clears flag for replay', () => {
    const saveSpy = vi.spyOn(localStorageService, 'saveBootSequenceCompleted');
    useBootSequenceStore.setState({ completed: true });
    useBootSequenceStore.getState().resetBoot();
    expect(useBootSequenceStore.getState().completed).toBe(false);
    expect(saveSpy).toHaveBeenCalledWith(false);
  });
});
