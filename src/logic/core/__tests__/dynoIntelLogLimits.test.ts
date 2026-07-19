import { describe, expect, it } from 'vitest';
import type { DynoIntelLogEntry } from '../dynoIntelLogTypes';
import {
  appendDynoIntelLogEntry,
  DYNO_INTEL_LOCAL_LOG_CAP,
  enforceDynoIntelLogCap,
} from '../dynoIntelLogLimits';

function makeEntry(uid: string, timestamp: number): DynoIntelLogEntry {
  return {
    id: `log-${timestamp}`,
    uid,
    timestamp,
    focusAxis: 'strength',
    userQuestion: `q-${timestamp}`,
    commentary: `c-${timestamp}`,
    closingBeatKind: 'return-ritual',
  };
}

describe('dynoIntelLogLimits', () => {
  it('caps every UID at 100 entries by newest timestamp', () => {
    const uid = 'user-a';
    const entries = Array.from({ length: DYNO_INTEL_LOCAL_LOG_CAP }, (_, index) =>
      makeEntry(uid, index + 1)
    );
    const incoming = makeEntry(uid, DYNO_INTEL_LOCAL_LOG_CAP + 1);

    const next = appendDynoIntelLogEntry(entries, incoming);

    expect(next).toHaveLength(DYNO_INTEL_LOCAL_LOG_CAP);
    expect(next[0]?.timestamp).toBe(101);
    expect(next.some((row) => row.timestamp === 1)).toBe(false);
  });

  it('sorts before slicing the shared device cap', () => {
    const uid = 'user-b';
    const shuffled = [3, 1, 4, 2].map((timestamp) => makeEntry(uid, timestamp));

    const capped = enforceDynoIntelLogCap(shuffled, 3);

    expect(capped.map((row) => row.timestamp)).toEqual([4, 3, 2]);
  });
});
