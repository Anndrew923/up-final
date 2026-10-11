import { describe, expect, it } from 'vitest';
import { formatCloudSyncUpdatedAt } from '../formatCloudSyncUpdatedAt';

describe('formatCloudSyncUpdatedAt', () => {
  it('formats a valid ISO timestamp as YYYY-MM-DD HH:mm in local time', () => {
    const iso = '2026-10-10T10:30:00.000Z';
    const d = new Date(iso);
    const expected = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-') +
      ' ' +
      [String(d.getHours()).padStart(2, '0'), String(d.getMinutes()).padStart(2, '0')].join(':');
    expect(formatCloudSyncUpdatedAt(iso)).toBe(expected);
  });

  it('returns the raw string when unparsable', () => {
    expect(formatCloudSyncUpdatedAt('not-a-date')).toBe('not-a-date');
  });
});
