import { describe, expect, it } from 'vitest';
import { parseFirestoreHistoryDoc, STRUCTURED_PROFILE_SCHEMA_VERSION } from '../structuredUserSyncPayload';

describe('parseFirestoreHistoryDoc', () => {
  it('accepts a valid v1 payload', () => {
    const row = {
      schemaVersion: STRUCTURED_PROFILE_SCHEMA_VERSION,
      cloudUpdatedAt: '2026-01-01T00:00:00.000Z',
      id: 'a1',
      createdAt: '2026-01-02T00:00:00.000Z',
      scores: { strength: 10 },
      overallScore: 50,
    };
    expect(parseFirestoreHistoryDoc(row)).toEqual({
      id: 'a1',
      createdAt: '2026-01-02T00:00:00.000Z',
      scores: { strength: 10 },
      overallScore: 50,
    });
  });

  it('rejects wrong schemaVersion when present', () => {
    expect(
      parseFirestoreHistoryDoc({
        schemaVersion: 99,
        id: 'a',
        createdAt: '2026-01-01T00:00:00.000Z',
        scores: {},
        overallScore: 0,
      })
    ).toBeNull();
  });

  it('rejects malformed payloads', () => {
    expect(parseFirestoreHistoryDoc(null)).toBeNull();
    expect(parseFirestoreHistoryDoc({})).toBeNull();
    expect(parseFirestoreHistoryDoc({ id: '', createdAt: 'x', scores: {}, overallScore: 0 })).toBeNull();
  });
});
