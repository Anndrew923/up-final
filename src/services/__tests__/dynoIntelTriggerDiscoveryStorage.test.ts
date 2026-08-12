import { describe, expect, it, vi, afterEach } from 'vitest';
import * as safeLocalStorage from '../../lib/safeLocalStorage';
import * as dynoIntelLogPersistence from '../dynoIntelLogPersistence';
import * as localStorageService from '../localStorageService';
import { DYNO_INTEL_TRIGGER_DISCOVERED_KEY } from '../localStorageService';

describe('dyno intel trigger discovery storage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes discovered flag via saveDynoIntelTriggerDiscovered', () => {
    const saveSpy = vi.spyOn(localStorageService, 'saveDynoIntelTriggerDiscovered');
    localStorageService.saveDynoIntelTriggerDiscovered(true);
    expect(saveSpy).toHaveBeenCalledWith(true);
    localStorageService.saveDynoIntelTriggerDiscovered(false);
    expect(saveSpy).toHaveBeenCalledWith(false);
  });

  it('loadDynoIntelTriggerDiscovered returns true only for stored "1"', () => {
    vi.spyOn(safeLocalStorage, 'safeGetItem').mockImplementation((key) =>
      key === DYNO_INTEL_TRIGGER_DISCOVERED_KEY ? '1' : null,
    );
    expect(localStorageService.loadDynoIntelTriggerDiscovered()).toBe(true);
    vi.mocked(safeLocalStorage.safeGetItem).mockReturnValue(null);
    expect(localStorageService.loadDynoIntelTriggerDiscovered()).toBe(false);
  });

  it('resolveDynoIntelTriggerDiscovered prefers stored key over log shards', () => {
    vi.spyOn(safeLocalStorage, 'safeGetItem').mockImplementation((key) =>
      key === DYNO_INTEL_TRIGGER_DISCOVERED_KEY ? '1' : null,
    );
    const logsSpy = vi.spyOn(dynoIntelLogPersistence, 'hasAnyDynoIntelLogs');
    expect(localStorageService.resolveDynoIntelTriggerDiscovered()).toBe(true);
    expect(logsSpy).not.toHaveBeenCalled();
  });

  it('resolveDynoIntelTriggerDiscovered falls back to intel logs when key absent', () => {
    vi.spyOn(safeLocalStorage, 'safeGetItem').mockReturnValue(null);
    vi.spyOn(dynoIntelLogPersistence, 'hasAnyDynoIntelLogs').mockReturnValue(true);
    expect(localStorageService.resolveDynoIntelTriggerDiscovered()).toBe(true);
  });
});
