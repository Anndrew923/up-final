import { describe, expect, it } from 'vitest';
import {
  mapLadderBatchCallableError,
  normalizeFirebaseCallableErrorCode,
} from '../ladderBatchCallableError';

describe('ladderBatchCallableError', () => {
  it('normalizes functions/ prefix', () => {
    expect(normalizeFirebaseCallableErrorCode('functions/failed-precondition')).toBe(
      'failed-precondition'
    );
  });

  it('maps App Check / failed-precondition', () => {
    expect(
      mapLadderBatchCallableError({
        code: 'functions/failed-precondition',
        message: 'Unhandled error App Check token is invalid.',
      }).reason
    ).toBe('app-check');
  });

  it('maps unauthenticated and permission-denied', () => {
    expect(
      mapLadderBatchCallableError({ code: 'functions/unauthenticated', message: 'auth' }).reason
    ).toBe('unauthenticated');
    expect(
      mapLadderBatchCallableError({ code: 'functions/permission-denied', message: 'denied' }).reason
    ).toBe('permission-denied');
  });

  it('reclassifies bare unauthenticated as app-check when Google session is healthy', () => {
    expect(
      mapLadderBatchCallableError(
        { code: 'functions/unauthenticated', message: 'Unauthenticated' },
        { hasGoogleSignedInUser: true }
      ).reason
    ).toBe('app-check');
  });

  it('maps internal transport failures', () => {
    expect(
      mapLadderBatchCallableError({ code: 'functions/unavailable', message: 'down' }).reason
    ).toBe('internal');
  });
});
