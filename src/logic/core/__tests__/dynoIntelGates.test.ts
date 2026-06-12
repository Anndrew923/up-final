import { describe, expect, it } from 'vitest';
import type { EntitlementState } from '../../../types/entitlement';
import {
  canUseDynoIntelFull,
  canUseDynoIntelTrial,
  resolveDynoIntelAccess,
  resolveDynoIntelSheetEntry,
} from '../dynoIntelGates';

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

  it('requires pro for cross-axis mode', () => {
    const access = resolveDynoIntelAccess(
      'cross-axis',
      buildEntitlement({ subscriptionStatus: 'free' }),
      'signed-in',
      false
    );
    expect(access.allowed).toBe(false);
    expect(access.blockReason).toBe('pro-required');
    expect(access.joinArenaFrom).toBe('dyno-intel');
    expect(canUseDynoIntelFull(buildEntitlement(), 'signed-in', false)).toBe(false);
  });

  it('allows pro user for weight-simulation mode', () => {
    const ent = buildEntitlement({ subscriptionStatus: 'pro' });
    const access = resolveDynoIntelAccess('weight-simulation', ent, 'signed-in', false);
    expect(access.allowed).toBe(true);
    expect(canUseDynoIntelFull(ent, 'signed-in', false)).toBe(true);
  });

  it('falls back core user from cross-axis suggestion to single-axis sheet entry', () => {
    const ent = buildEntitlement();
    const entry = resolveDynoIntelSheetEntry('cross-axis', ent, 'signed-in', false);
    expect(entry.openMode).toBe('single-axis');
    expect(entry.access.allowed).toBe(true);
  });

  it('keeps cross-axis for pro users on lobby surfaces', () => {
    const ent = buildEntitlement({ subscriptionStatus: 'pro' });
    const entry = resolveDynoIntelSheetEntry('cross-axis', ent, 'signed-in', false);
    expect(entry.openMode).toBe('cross-axis');
    expect(entry.access.allowed).toBe(true);
  });
});
