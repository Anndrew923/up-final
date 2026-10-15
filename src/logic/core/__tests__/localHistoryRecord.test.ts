import { describe, expect, it } from 'vitest';
import {
  isAssessmentRawInputsV1,
  isLocalHistoryRecord,
  sanitizeLocalHistoryRecord,
  type LocalHistoryRecord,
} from '../localHistoryRecord';

function baseRecord(overrides: Partial<LocalHistoryRecord> = {}): LocalHistoryRecord {
  return {
    id: 'hist-1',
    createdAt: '2026-10-15T00:00:00.000Z',
    scores: { strength: 80 },
    overallScore: 80,
    ...overrides,
  };
}

describe('isLocalHistoryRecord (rawInputs downward compatibility)', () => {
  it('accepts legacy scores-only records without rawInputs', () => {
    expect(isLocalHistoryRecord(baseRecord())).toBe(true);
    expect(isLocalHistoryRecord(baseRecord({ note: 'legacy' }))).toBe(true);
  });

  it('accepts records with a valid AssessmentRawInputsV1 blob', () => {
    expect(
      isLocalHistoryRecord(
        baseRecord({
          rawInputs: {
            schemaVersion: 1,
            grip: { peakKg: 50 },
            ffmi: { bodyFatPct: 15 },
            physicalProfileSnapshot: {
              gender: 'female',
              age: 30,
              heightCm: 165,
              weightKg: 58,
            },
          },
        })
      )
    ).toBe(true);
  });

  it('rejects records with corrupt rawInputs while still rejecting other malformed rows', () => {
    expect(
      isLocalHistoryRecord({
        ...baseRecord(),
        rawInputs: { schemaVersion: 1, grip: 'nope' },
      })
    ).toBe(false);
    expect(
      isLocalHistoryRecord({
        ...baseRecord(),
        rawInputs: { schemaVersion: 99, grip: { peakKg: 1 } },
      })
    ).toBe(false);
    expect(isLocalHistoryRecord({ ...baseRecord(), id: '' })).toBe(false);
  });
});

describe('sanitizeLocalHistoryRecord', () => {
  it('returns valid records unchanged', () => {
    const row = baseRecord({
      rawInputs: { schemaVersion: 1, power: { explosivePower: { sprintSeconds: 11 } } },
    });
    expect(sanitizeLocalHistoryRecord(row)).toEqual(row);
  });

  it('strips corrupt rawInputs and keeps the score snapshot', () => {
    expect(
      sanitizeLocalHistoryRecord({
        ...baseRecord(),
        rawInputs: { schemaVersion: 1, grip: 'bad' },
      })
    ).toEqual(baseRecord());
  });

  it('keeps valid rawInputs when only note is corrupt', () => {
    expect(
      sanitizeLocalHistoryRecord({
        ...baseRecord(),
        note: 123,
        rawInputs: { schemaVersion: 1, grip: { peakKg: 48 } },
      })
    ).toEqual({
      ...baseRecord(),
      rawInputs: { schemaVersion: 1, grip: { peakKg: 48 } },
    });
  });

  it('returns null for fundamentally malformed rows', () => {
    expect(sanitizeLocalHistoryRecord(null)).toBeNull();
    expect(sanitizeLocalHistoryRecord({ id: '', scores: {}, overallScore: 0 })).toBeNull();
  });
});

describe('isAssessmentRawInputsV1', () => {
  it('requires schemaVersion 1 and shallow block shapes', () => {
    expect(isAssessmentRawInputsV1({ schemaVersion: 1 })).toBe(true);
    expect(isAssessmentRawInputsV1({ schemaVersion: 1, muscle: { muscle: { smmKg: 40 } } })).toBe(
      true
    );
    expect(isAssessmentRawInputsV1(null)).toBe(false);
    expect(isAssessmentRawInputsV1({ schemaVersion: 2 })).toBe(false);
    expect(isAssessmentRawInputsV1({ schemaVersion: 1, ffmi: { bodyFatPct: '12' } })).toBe(false);
  });
});
