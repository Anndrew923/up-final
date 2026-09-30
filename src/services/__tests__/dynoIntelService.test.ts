import { describe, expect, it } from 'vitest';
import {
  isDynoIntelInProgressAbort,
  mapDynoIntelCallableErrorToMessageKey,
} from '../../services/dynoIntelService';

describe('mapDynoIntelCallableErrorToMessageKey', () => {
  it('maps failed-precondition to gemini not configured copy', () => {
    expect(
      mapDynoIntelCallableErrorToMessageKey({ code: 'functions/failed-precondition' })
    ).toBe('dynoIntel.error.geminiNotConfigured');
  });

  it('maps invalid-argument to invalid context copy', () => {
    expect(mapDynoIntelCallableErrorToMessageKey({ code: 'functions/invalid-argument' })).toBe(
      'dynoIntel.error.invalidContext'
    );
  });

  it('maps resource-exhausted to gemini quota copy', () => {
    expect(mapDynoIntelCallableErrorToMessageKey({ code: 'functions/resource-exhausted' })).toBe(
      'dynoIntel.error.geminiQuotaExhausted'
    );
  });

  it('maps inference malformed internal errors to dedicated copy', () => {
    expect(
      mapDynoIntelCallableErrorToMessageKey({
        code: 'functions/internal',
        message: 'DYNO_INTEL_INFERENCE_MALFORMED',
      })
    ).toBe('dynoIntel.error.inferenceMalformed');
  });

  it('maps generic inference internal errors to dedicated copy', () => {
    expect(
      mapDynoIntelCallableErrorToMessageKey({
        code: 'functions/internal',
        message: 'DYNO INTEL inference failed',
      })
    ).toBe('dynoIntel.error.inferenceFailed');
  });

  it('returns null for unknown transport failures', () => {
    expect(mapDynoIntelCallableErrorToMessageKey({ code: 'functions/internal' })).toBeNull();
  });

  it('returns null for in-progress abort so UI stays quiet', () => {
    expect(
      mapDynoIntelCallableErrorToMessageKey({
        code: 'functions/aborted',
        message: 'request-in-progress',
      })
    ).toBeNull();
  });
});

describe('isDynoIntelInProgressAbort', () => {
  it('detects aborted in-flight duplicates', () => {
    expect(
      isDynoIntelInProgressAbort({ code: 'functions/aborted', message: 'request-in-progress' })
    ).toBe(true);
    expect(isDynoIntelInProgressAbort({ code: 'functions/internal' })).toBe(false);
  });
});
