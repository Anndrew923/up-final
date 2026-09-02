import { describe, expect, it, vi } from 'vitest';
import { getFirebaseAuthErrorCode, getFirebaseAuthErrorDetails } from '../firebaseAuthError';

describe('firebaseAuthError', () => {
  it('extracts Firebase auth error code', () => {
    expect(getFirebaseAuthErrorCode({ code: 'auth/invalid-credential' })).toBe(
      'auth/invalid-credential'
    );
    expect(getFirebaseAuthErrorCode(new Error('plain'))).toBe('');
  });

  it('extracts code and message together', () => {
    expect(
      getFirebaseAuthErrorDetails({
        code: 'auth/operation-not-allowed',
        message: 'Provider disabled',
      })
    ).toEqual({
      code: 'auth/operation-not-allowed',
      message: 'Provider disabled',
    });
  });
});
