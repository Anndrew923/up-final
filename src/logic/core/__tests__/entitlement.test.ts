import { afterEach, describe, expect, it } from 'vitest';
import { MONETIZATION_CONFIG } from '../../../config/monetization';
import { joinArenaPath } from '../../../lib/joinArenaNavigation';
import { uiGateNextRoute } from '../../../lib/uiGateNavigation';
import {
  canAccessLeaderboard,
  getEntitlementReasonCode,
  hasCoreAccess,
  hasProAccess,
  resolveLeaderboardAccessReason,
  resolveUiGate,
  shouldBlockStructuredUserSync,
} from '../entitlement';
import { resolveLeaderboardUploadGate } from '../../../hooks/useLeaderboardUpload';
import type { EntitlementState } from '../../../types/entitlement';

type MutableMonetizationConfig = {
  leaderboardPaywallEnabled: boolean;
  leaderboardRequireGoogleSignIn: boolean;
  leaderboardPromotionMilestones: readonly number[];
};

const mutableMonetizationConfig = MONETIZATION_CONFIG as unknown as MutableMonetizationConfig;
const defaultPaywall = mutableMonetizationConfig.leaderboardPaywallEnabled;

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

describe('entitlement core guards', () => {
  it('allows core local features when purchaseStatus=owned', () => {
    expect(hasCoreAccess(buildEntitlement({ purchaseStatus: 'owned' }))).toBe(true);
  });

  it('blocks leaderboard when subscription is free/expired', () => {
    const free = buildEntitlement({ subscriptionStatus: 'free' });
    const expired = buildEntitlement({ subscriptionStatus: 'expired' });

    expect(canAccessLeaderboard(free)).toBe(true);
    expect(canAccessLeaderboard(expired)).toBe(true);
    expect(getEntitlementReasonCode(free, 'leaderboard-read')).toBe('open-access');
  });

  it('allows leaderboard when subscription is pro/grace', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const pro = buildEntitlement({ subscriptionStatus: 'pro' });
    const grace = buildEntitlement({
      subscriptionStatus: 'grace',
      proExpiresAt: '2026-01-01T12:00:00.000Z',
    });

    expect(hasProAccess(pro, now)).toBe(true);
    expect(canAccessLeaderboard(pro, now)).toBe(true);
    expect(hasProAccess(grace, now)).toBe(true);
    expect(canAccessLeaderboard(grace, now)).toBe(true);
  });

  it('structured user sync is Pro-only regardless of leaderboard paywall mode', () => {
    expect(shouldBlockStructuredUserSync(buildEntitlement({ subscriptionStatus: 'free' }))).toBe(
      true
    );
    expect(shouldBlockStructuredUserSync(buildEntitlement({ subscriptionStatus: 'pro' }))).toBe(
      false
    );
  });
});

describe('resolveUiGate', () => {
  afterEach(() => {
    mutableMonetizationConfig.leaderboardPaywallEnabled = defaultPaywall;
  });

  it('defers gate while auth is loading', () => {
    const ent = buildEntitlement({ subscriptionStatus: 'free' });
    expect(resolveUiGate('ladder-read', ent, 'loading', false).kind).toBe('none');
  });

  it('returns auth gate before any Pro check', () => {
    const ent = buildEntitlement({ subscriptionStatus: 'pro' });
    const gate = resolveUiGate('cloud-sync', ent, 'signed-out', false);
    expect(gate.kind).toBe('auth');
    expect(uiGateNextRoute(gate)).toBe('/auth-choice');
  });

  it('returns auth gate for anonymous users', () => {
    const ent = buildEntitlement({ subscriptionStatus: 'pro' });
    const gate = resolveUiGate('ladder-read', ent, 'signed-in', true);
    expect(gate.kind).toBe('auth');
  });

  it('allows ladder read/upload during beta without Pro', () => {
    mutableMonetizationConfig.leaderboardPaywallEnabled = false;
    const ent = buildEntitlement({ subscriptionStatus: 'free' });
    expect(resolveUiGate('ladder-read', ent, 'signed-in', false).kind).toBe('none');
    expect(resolveUiGate('ladder-upload', ent, 'signed-in', false).kind).toBe('none');
  });

  it('requires Pro for cloud sync even during beta', () => {
    mutableMonetizationConfig.leaderboardPaywallEnabled = false;
    const ent = buildEntitlement({ subscriptionStatus: 'free' });
    const gate = resolveUiGate('cloud-sync', ent, 'signed-in', false);
    expect(gate.kind).toBe('pro');
    expect(gate.joinArenaFrom).toBe('backup');
    expect(uiGateNextRoute(gate)).toBe(joinArenaPath('backup'));
  });

  it('requires Pro for ladder when paywall is enabled', () => {
    mutableMonetizationConfig.leaderboardPaywallEnabled = true;
    const ent = buildEntitlement({ subscriptionStatus: 'free' });
    const gate = resolveUiGate('ladder-read', ent, 'signed-in', false);
    expect(gate.kind).toBe('pro');
    expect(gate.joinArenaFrom).toBe('ladder');
    expect(uiGateNextRoute(gate)).toBe(joinArenaPath('ladder'));
  });

  it('maps ladder upload gate to UiGateKind-aligned codes', () => {
    const ent = buildEntitlement({ subscriptionStatus: 'free' });
    mutableMonetizationConfig.leaderboardPaywallEnabled = false;
    expect(resolveLeaderboardUploadGate(88, ent, 'signed-in', false)).toBe('ok');
    expect(resolveLeaderboardUploadGate(88, ent, 'signed-out', false)).toBe('auth');
    expect(resolveLeaderboardUploadGate(88, ent, 'signed-in', true)).toBe('auth');
    expect(resolveLeaderboardUploadGate(null, ent, 'signed-in', false)).toBe('no-score');

    mutableMonetizationConfig.leaderboardPaywallEnabled = true;
    expect(resolveLeaderboardUploadGate(88, ent, 'signed-in', false)).toBe('pro');
  });

  it('maps ladder access reason from ui gate', () => {
    mutableMonetizationConfig.leaderboardPaywallEnabled = false;
    const ent = buildEntitlement({ subscriptionStatus: 'free' });
    expect(resolveLeaderboardAccessReason({ kind: 'auth' }, ent)).toBe('auth-required');
    expect(resolveLeaderboardAccessReason({ kind: 'pro' }, ent)).toBe('pro-required');
    expect(resolveLeaderboardAccessReason({ kind: 'none' }, ent)).toBe('open-access');
  });
});
