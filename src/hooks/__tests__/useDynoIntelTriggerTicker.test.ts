import { describe, expect, it } from 'vitest';
import { resolveDynoTriggerPhaseAtIndex } from '../useDynoIntelTriggerTicker';

describe('resolveDynoTriggerPhaseAtIndex', () => {
  it('maps ticker indices to B3 expand phases', () => {
    expect(resolveDynoTriggerPhaseAtIndex(0)).toBe('online');
    expect(resolveDynoTriggerPhaseAtIndex(1)).toBe('scanning');
    expect(resolveDynoTriggerPhaseAtIndex(2)).toBe('coreMax');
  });

  it('wraps negative and overflow indices safely', () => {
    expect(resolveDynoTriggerPhaseAtIndex(-1)).toBe('coreMax');
    expect(resolveDynoTriggerPhaseAtIndex(3)).toBe('online');
  });
});
