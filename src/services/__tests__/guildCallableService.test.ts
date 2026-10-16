import { describe, expect, it } from 'vitest';
import { mapGuildCallableError } from '../guildCallableService';

describe('mapGuildCallableError', () => {
  it('maps auth and entitlement gates', () => {
    expect(mapGuildCallableError('functions/unauthenticated')).toBe('auth-required');
    expect(mapGuildCallableError('permission-denied pro-required')).toBe('pro-required');
  });

  it('maps single-guild and capacity errors', () => {
    expect(mapGuildCallableError('failed-precondition already-in-guild')).toBe('already-in-guild');
    expect(mapGuildCallableError('resource-exhausted guild-full')).toBe('guild-full');
    expect(mapGuildCallableError('resource-exhausted guild-join-rate-limited')).toBe(
      'rate-limited'
    );
  });

  it('maps coach / leave / kick reasons', () => {
    expect(mapGuildCallableError('permission-denied not-coach')).toBe('not-coach');
    expect(mapGuildCallableError('failed-precondition coach-cannot-leave')).toBe(
      'coach-cannot-leave'
    );
    expect(mapGuildCallableError('invalid-argument cannot-kick-self')).toBe('cannot-kick-self');
  });

  it('maps invite / name validation', () => {
    expect(mapGuildCallableError('not-found invalid-code')).toBe('invalid-code');
    expect(mapGuildCallableError('invalid-argument invalid-name')).toBe('invalid-name');
    expect(mapGuildCallableError('invalid-argument invalid-tag')).toBe('invalid-tag');
    expect(mapGuildCallableError('not-found')).toBe('not-found');
  });

  it('maps app check and bare resource-exhausted', () => {
    expect(mapGuildCallableError('App Check token is invalid')).toBe('app-check');
    expect(mapGuildCallableError('functions/resource-exhausted')).toBe('rate-limited');
  });
});
