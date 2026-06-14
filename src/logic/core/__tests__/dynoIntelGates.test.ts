import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EntitlementState } from '../../../types/entitlement';
import {
  canUseDynoIntelFull,
  canUseDynoIntelMode,
  canUseDynoIntelTrial,
  resolveDynoIntelAccess,
  resolveDynoIntelSheetEntry,
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

  it('allows signed-in core user for single-axis trial', () => {
    const access = resolveDynoIntelAccess('single-axis', buildEntitlement(), 'signed-in', false);
    expect(access.allowed).toBe(true);
    expect(canUseDynoIntelTrial(buildEntitlement(), 'signed-in', false)).toBe(true);
  });

  it('blocks non-core users from trial bait', () => {
    const ent = buildEntitlement({ purchaseStatus: 'none' });
    const access = resolveDynoIntelAccess('single-axis', ent, 'signed-in', false);
    expect(access.allowed).toBe(false);
    expect(access.blockReason).toBe('core-required');
  });

  it('allows core user for cross-axis mode', () => {
    const ent = buildEntitlement({ subscriptionStatus: 'free' });
    const access = resolveDynoIntelAccess('cross-axis', ent, 'signed-in', false);
    expect(access.allowed).toBe(true);
    expect(canUseDynoIntelFull(ent, 'signed-in', false)).toBe(false);
    expect(canUseDynoIntelMode('cross-axis', ent, 'signed-in', false)).toBe(true);
  });

  it('requires pro for weight-simulation mode', () => {
    const ent = buildEntitlement({ subscriptionStatus: 'free' });
    const access = resolveDynoIntelAccess('weight-simulation', ent, 'signed-in', false);
    expect(access.allowed).toBe(false);
    expect(access.blockReason).toBe('pro-required');
    expect(access.joinArenaFrom).toBe('dyno-intel');
    expect(canUseDynoIntelMode('weight-simulation', ent, 'signed-in', false)).toBe(false);
  });

  it('allows pro user for weight-simulation mode', () => {
    const ent = buildEntitlement({ subscriptionStatus: 'pro' });
    const access = resolveDynoIntelAccess('weight-simulation', ent, 'signed-in', false);
    expect(access.allowed).toBe(true);
    expect(canUseDynoIntelFull(ent, 'signed-in', false)).toBe(true);
  });

  it('opens cross-axis for core users without single-axis fallback', () => {
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

  describe('pro bypass (dev/beta)', () => {
    it('allows cross-axis for signed-in users when bypass is active', () => {
      mockIsDynoIntelProBypassActive.mockReturnValue(true);
      const ent = buildEntitlement({ purchaseStatus: 'none', subscriptionStatus: 'free' });
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

    it('allows core cross-axis when bypass is inactive', () => {
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
