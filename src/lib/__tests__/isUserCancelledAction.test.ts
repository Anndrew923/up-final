import { describe, expect, it } from 'vitest';
import { isUserCancelledAction } from '../isUserCancelledAction';

describe('isUserCancelledAction', () => {
  it('matches AbortError and cancel-like messages', () => {
    const abort = new Error('The operation was aborted');
    abort.name = 'AbortError';
    expect(isUserCancelledAction(abort)).toBe(true);
    expect(isUserCancelledAction(new Error('User cancelled photos app'))).toBe(true);
    expect(isUserCancelledAction(new Error('Share canceled'))).toBe(true);
  });

  it('does not treat permission denial as cancel', () => {
    const denied = new Error('Permission denied');
    denied.name = 'NotAllowedError';
    expect(isUserCancelledAction(denied)).toBe(false);
  });
});
