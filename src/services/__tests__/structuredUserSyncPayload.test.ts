import { describe, expect, it } from 'vitest';
import {
  historyRecordToFirestore,
  parseFirestoreHistoryDoc,
  STRUCTURED_PROFILE_SCHEMA_VERSION,
} from '../structuredUserSyncPayload';

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

  it('round-trips optional rawInputs without breaking scores-only docs', () => {
    const withRaw = {
      schemaVersion: STRUCTURED_PROFILE_SCHEMA_VERSION,
      cloudUpdatedAt: '2026-01-01T00:00:00.000Z',
      id: 'raw-1',
      createdAt: '2026-01-02T00:00:00.000Z',
      scores: { gripStrength: 90 },
      overallScore: 90,
      rawInputs: {
        schemaVersion: 1 as const,
        grip: { peakKg: 55 },
      },
    };
    expect(parseFirestoreHistoryDoc(withRaw)).toEqual({
      id: 'raw-1',
      createdAt: '2026-01-02T00:00:00.000Z',
      scores: { gripStrength: 90 },
      overallScore: 90,
      rawInputs: {
        schemaVersion: 1,
        grip: { peakKg: 55 },
      },
    });

    expect(
      historyRecordToFirestore(
        {
          id: 'local-1',
          createdAt: '2026-01-02T00:00:00.000Z',
          scores: { strength: 10 },
          overallScore: 10,
          rawInputs: { schemaVersion: 1, muscle: { muscle: { smmKg: 40 } } },
        },
        '2026-01-03T00:00:00.000Z'
      )
    ).toEqual({
      schemaVersion: STRUCTURED_PROFILE_SCHEMA_VERSION,
      cloudUpdatedAt: '2026-01-03T00:00:00.000Z',
      id: 'local-1',
      createdAt: '2026-01-02T00:00:00.000Z',
      scores: { strength: 10 },
      overallScore: 10,
      rawInputs: { schemaVersion: 1, muscle: { muscle: { smmKg: 40 } } },
    });
  });

  it('strips corrupt rawInputs but still restores scores', () => {
    expect(
      parseFirestoreHistoryDoc({
        schemaVersion: STRUCTURED_PROFILE_SCHEMA_VERSION,
        id: 'strip',
        createdAt: '2026-01-02T00:00:00.000Z',
        scores: { cardio: 70 },
        overallScore: 70,
        rawInputs: { schemaVersion: 1, grip: 'bad' },
      })
    ).toEqual({
      id: 'strip',
      createdAt: '2026-01-02T00:00:00.000Z',
      scores: { cardio: 70 },
      overallScore: 70,
    });
  });

  it('omits corrupt rawInputs when serializing to Firestore', () => {
    expect(
      historyRecordToFirestore(
        {
          id: 'local-bad',
          createdAt: '2026-01-02T00:00:00.000Z',
          scores: { strength: 10 },
          overallScore: 10,
          // Runtime-corrupt blob (typed callers should not produce this).
          rawInputs: { schemaVersion: 1, grip: 'bad' } as never,
        },
        '2026-01-03T00:00:00.000Z'
      )
    ).toEqual({
      schemaVersion: STRUCTURED_PROFILE_SCHEMA_VERSION,
      cloudUpdatedAt: '2026-01-03T00:00:00.000Z',
      id: 'local-bad',
      createdAt: '2026-01-02T00:00:00.000Z',
      scores: { strength: 10 },
      overallScore: 10,
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
    expect(
      parseFirestoreHistoryDoc({ id: '', createdAt: 'x', scores: {}, overallScore: 0 })
    ).toBeNull();
  });
});
