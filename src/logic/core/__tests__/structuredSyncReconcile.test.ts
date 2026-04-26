import { describe, expect, it } from 'vitest';
import { isRemoteNewer, parseIsoMs } from '../structuredSyncReconcile';

describe('structuredSyncReconcile', () => {
  it('parseIsoMs returns 0 for invalid input', () => {
    expect(parseIsoMs(undefined)).toBe(0);
    expect(parseIsoMs('')).toBe(0);
    expect(parseIsoMs('not-a-date')).toBe(0);
  });

  it('isRemoteNewer compares ISO timestamps', () => {
    expect(isRemoteNewer('2026-02-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')).toBe(true);
    expect(isRemoteNewer('2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z')).toBe(false);
    expect(isRemoteNewer('2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')).toBe(false);
  });
});
