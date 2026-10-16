import { describe, expect, it } from 'vitest';
import {
  resolveMembershipSyncSurface,
  resolvePublishSuccessBannerKey,
} from '../membershipSyncSurface';

describe('resolveMembershipSyncSurface', () => {
  it('returns pending while guild binding is unknown', () => {
    expect(resolveMembershipSyncSurface(null)).toBe('pending');
  });

  it('returns dual when in a club', () => {
    expect(resolveMembershipSyncSurface(true)).toBe('dual');
  });

  it('returns global-only when not in a club', () => {
    expect(resolveMembershipSyncSurface(false)).toBe('global-only');
  });
});

describe('resolvePublishSuccessBannerKey', () => {
  it('maps cloud outcomes to breakthrough banner keys', () => {
    expect(resolvePublishSuccessBannerKey('arena')).toContain('ArenaSuccess');
    expect(resolvePublishSuccessBannerKey('guild')).toContain('GuildSuccess');
  });
});
