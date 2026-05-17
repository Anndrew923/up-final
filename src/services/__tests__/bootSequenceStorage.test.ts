import { describe, expect, it, vi } from 'vitest';
import * as localStorageService from '../localStorageService';

describe('boot sequence storage', () => {
  it('writes completed flag via saveBootSequenceCompleted', () => {
    const saveSpy = vi.spyOn(localStorageService, 'saveBootSequenceCompleted');
    localStorageService.saveBootSequenceCompleted(true);
    expect(saveSpy).toHaveBeenCalledWith(true);
    localStorageService.saveBootSequenceCompleted(false);
    expect(saveSpy).toHaveBeenCalledWith(false);
    saveSpy.mockRestore();
  });

  it('loadBootSequenceCompleted returns true only for stored "1"', () => {
    const loadSpy = vi
      .spyOn(localStorageService, 'loadBootSequenceCompleted')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    expect(localStorageService.loadBootSequenceCompleted()).toBe(false);
    expect(localStorageService.loadBootSequenceCompleted()).toBe(true);
    loadSpy.mockRestore();
  });
});
