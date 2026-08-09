import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EntitlementState } from '../../../types/entitlement';
import {
  canUseDynoIntelFull,
  canUseDynoIntelMode,
  canUseDynoIntelTrial,
  isEntitlementCheckSettled,
  resolveDynoIntelAccess,
  resolveDynoIntelSheetEntry,
  shouldOpenDynoIntelQuotaExhaustedPaywall,
} from '../dynoIntelGates';

const { mockIsDynoIntelProBypassActive } = vi.hoisted(() => ({
  mockIsDynoIntelProBypassActive: vi.fn(() => false),
}));

vi.mock('../../../config/dynoIntelAccess', () => ({
  isDynoIntelProBypassActive: mockIsDynoIntelProBypassActive,
}));

function buildEntitlement(overrides: Partial<EntitlementState> = {}): EntitlementState {
  return {
    purchaseStatus: 'owned',
    subscriptionStatus: 'free',
    isPro: false,
    proExpiresAt: null,
    planId: 'core_lifetime_099',
    lastCheckedAt: null,
    proPurchaseCooldownUntil: null,
    ...overrides,
  };
}

describe('dynoIntelGates', () => {
  beforeEach(() => {
    mockIsDynoIntelProBypassActive.mockReturnValue(false);
  });

  it('blocks anonymous users with auth gate', () => {
    const access = resolveDynoIntelAccess('single-axis', buildEntitlement(), 'signed-in', true);
    expect(access.allowed).toBe(false);
    expect(access.blockReason).toBe('auth');
  });

  it('allows signed-in Core free users on trial modes within daily quota path', () => {
    const access = resolveDynoIntelAccess('single-axis', buildEntitlement(), 'signed-in', false);
    expect(access.allowed).toBe(true);
    expect(canUseDynoIntelTrial(buildEntitlement(), 'signed-in', false)).toBe(true);
  });

  it('allows cross-axis trial for Core free users without Pro', () => {
    const ent = buildEntitlement({ subscriptionStatus: 'free' });
    const access = resolveDynoIntelAccess('cross-axis', ent, 'signed-in', false);
    expect(access.allowed).toBe(true);
    expect(canUseDynoIntelFull(ent, 'signed-in', false)).toBe(false);
    expect(canUseDynoIntelMode('cross-axis', ent, 'signed-in', false)).toBe(true);
  });

  it('blocks trial modes when Core is not owned', () => {
    const ent = buildEntitlement({ purchaseStatus: 'none', subscriptionStatus: 'free' });
    const access = resolveDynoIntelAccess('cross-axis', ent, 'signed-in', false);
    expect(access.allowed).toBe(false);
    expect(access.blockReason).toBe('pro-required');
    expect(canUseDynoIntelTrial(ent, 'signed-in', false)).toBe(false);
  });

  it('requires pro for weight-simulation mode', () => {
    const ent = buildEntitlement({ subscriptionStatus: 'free' });
    const access = resolveDynoIntelAccess('weight-simulation', ent, 'signed-in', false);
    expect(access.allowed).toBe(false);
    expect(access.blockReason).toBe('pro-required');
    expect(access.joinArenaFrom).toBe('dyno-intel');
    expect(canUseDynoIntelMode('weight-simulation', ent, 'signed-in', false)).toBe(false);
  });

  it('allows pro user for all Dyno modes', () => {
    const ent = buildEntitlement({
      subscriptionStatus: 'pro',
      proExpiresAt: '2099-01-01T00:00:00.000Z',
    });
    expect(resolveDynoIntelAccess('cross-axis', ent, 'signed-in', false).allowed).toBe(true);
    expect(resolveDynoIntelAccess('weight-simulation', ent, 'signed-in', false).allowed).toBe(true);
    expect(canUseDynoIntelFull(ent, 'signed-in', false)).toBe(true);
  });

  it('opens sheet entry for Core free users on lobby surfaces', () => {
    const ent = buildEntitlement();
    const entry = resolveDynoIntelSheetEntry('cross-axis', ent, 'signed-in', false);
    expect(entry.openMode).toBe('cross-axis');
    expect(entry.access.allowed).toBe(true);
  });

  it('keeps cross-axis for pro users on lobby surfaces', () => {
    const ent = buildEntitlement({ subscriptionStatus: 'pro' });
    const entry = resolveDynoIntelSheetEntry('cross-axis', ent, 'signed-in', false);
    expect(entry.openMode).toBe('cross-axis');
    expect(entry.access.allowed).toBe(true);
  });

  describe('race: auth loading and entitlement settle', () => {
    it('maps auth loading to pending — never auth gate or pro-required paywall', () => {
      const access = resolveDynoIntelAccess('cross-axis', buildEntitlement(), 'loading', false);
      expect(access.allowed).toBe(false);
      expect(access.blockReason).toBe('pending');
    });

    it('treats missing lastCheckedAt or in-flight refresh as unsettled', () => {
      expect(isEntitlementCheckSettled(buildEntitlement({ lastCheckedAt: null }), false)).toBe(
        false
      );
      expect(
        isEntitlementCheckSettled(
          buildEntitlement({ lastCheckedAt: '2026-08-09T00:00:00.000Z' }),
          true
        )
      ).toBe(false);
      expect(
        isEntitlementCheckSettled(
          buildEntitlement({ lastCheckedAt: '2026-08-09T00:00:00.000Z' }),
          false
        )
      ).toBe(true);
    });

    it('does not open quota-exhausted paywall while RC refresh is still running', () => {
      expect(
        shouldOpenDynoIntelQuotaExhaustedPaywall({
          entitlementSettled: false,
          hasProFullAccess: false,
          quotaSynced: true,
          remaining: 0,
        })
      ).toBe(false);
    });

    it('does not open quota-exhausted paywall for confirmed Pro even at remaining 0', () => {
      expect(
        shouldOpenDynoIntelQuotaExhaustedPaywall({
          entitlementSettled: true,
          hasProFullAccess: true,
          quotaSynced: true,
          remaining: 0,
        })
      ).toBe(false);
    });

    it('opens quota-exhausted paywall only when settled, non-Pro, synced, and remaining 0', () => {
      expect(
        shouldOpenDynoIntelQuotaExhaustedPaywall({
          entitlementSettled: true,
          hasProFullAccess: false,
          quotaSynced: true,
          remaining: 0,
        })
      ).toBe(true);
      expect(
        shouldOpenDynoIntelQuotaExhaustedPaywall({
          entitlementSettled: true,
          hasProFullAccess: false,
          quotaSynced: true,
          remaining: 1,
        })
      ).toBe(false);
      expect(
        shouldOpenDynoIntelQuotaExhaustedPaywall({
          entitlementSettled: true,
          hasProFullAccess: false,
          quotaSynced: false,
          remaining: 0,
        })
      ).toBe(false);
    });
  });

  describe('pro bypass (dev/beta)', () => {
    it('allows cross-axis for signed-in users when bypass is active', () => {
      mockIsDynoIntelProBypassActive.mockReturnValue(true);
      const ent = buildEntitlement({ purchaseStatus: 'owned', subscriptionStatus: 'free' });
      const access = resolveDynoIntelAccess('cross-axis', ent, 'signed-in', false);
      expect(access.allowed).toBe(true);
      expect(canUseDynoIntelFull(ent, 'signed-in', false)).toBe(true);
    });

    it('opens cross-axis sheet entry when bypass is active without pro subscription', () => {
      mockIsDynoIntelProBypassActive.mockReturnValue(true);
      const ent = buildEntitlement({ subscriptionStatus: 'free' });
      const entry = resolveDynoIntelSheetEntry('cross-axis', ent, 'signed-in', false);
      expect(entry.openMode).toBe('cross-axis');
      expect(entry.access.allowed).toBe(true);
    });

    it('still blocks anonymous users when bypass is active', () => {
      mockIsDynoIntelProBypassActive.mockReturnValue(true);
      const access = resolveDynoIntelAccess('cross-axis', buildEntitlement(), 'signed-in', true);
      expect(access.allowed).toBe(false);
      expect(access.blockReason).toBe('auth');
      expect(canUseDynoIntelFull(buildEntitlement(), 'signed-in', true)).toBe(false);
    });

    it('allows Core free users on trial path when bypass is inactive', () => {
      mockIsDynoIntelProBypassActive.mockReturnValue(false);
      const access = resolveDynoIntelAccess(
        'cross-axis',
        buildEntitlement({ subscriptionStatus: 'free' }),
        'signed-in',
        false
      );
      expect(access.allowed).toBe(true);
    });
  });
});
