import { describe, expect, it } from 'vitest';
import type { DynoIntelLogEntry } from '../dynoIntelLogTypes';
import {
  appendDynoIntelLogEntry,
  DYNO_INTEL_CORE_LOG_CAP,
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
  it('caps Core users at 5 entries by newest timestamp', () => {
    const uid = 'user-a';
    const entries = [5, 4, 3, 2, 1].map((ts) => makeEntry(uid, ts));
    const incoming = makeEntry(uid, 6);

    const next = appendDynoIntelLogEntry(entries, incoming, false);

    expect(next).toHaveLength(DYNO_INTEL_CORE_LOG_CAP);
    expect(next.map((row) => row.timestamp)).toEqual([6, 5, 4, 3, 2]);
    expect(next.some((row) => row.timestamp === 1)).toBe(false);
  });

  it('allows Pro users unlimited local entries', () => {
    const uid = 'pro-user';
    const entries = Array.from({ length: 8 }, (_, index) => makeEntry(uid, index + 1));
    const incoming = makeEntry(uid, 99);

    const next = appendDynoIntelLogEntry(entries, incoming, true);

    expect(next).toHaveLength(9);
    expect(next[0]?.timestamp).toBe(99);
  });

  it('enforceDynoIntelLogCap sorts before slicing for Core', () => {
    const uid = 'user-b';
    const shuffled = [makeEntry(uid, 1), makeEntry(uid, 5), makeEntry(uid, 3), makeEntry(uid, 2), makeEntry(uid, 4), makeEntry(uid, 6)];

    const capped = enforceDynoIntelLogCap(shuffled, false);

    expect(capped.map((row) => row.timestamp)).toEqual([6, 5, 4, 3, 2]);
  });
});
