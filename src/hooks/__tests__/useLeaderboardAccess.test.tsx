/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { MONETIZATION_CONFIG } from '../../config/monetization';
import { useLeaderboardAccess, type LeaderboardAccessResult } from '../useLeaderboardAccess';
import { useAuthStore } from '../../stores/authStore';
import { useEntitlementStore } from '../../stores/entitlementStore';

type MutableMonetizationConfig = {
  leaderboardPaywallEnabled: boolean;
  leaderboardRequireGoogleSignIn: boolean;
  leaderboardPromotionMilestones: readonly number[];
};

const mutableMonetizationConfig = MONETIZATION_CONFIG as unknown as MutableMonetizationConfig;

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const defaultConfigSnapshot: MutableMonetizationConfig = {
  leaderboardPaywallEnabled: mutableMonetizationConfig.leaderboardPaywallEnabled,
  leaderboardRequireGoogleSignIn: mutableMonetizationConfig.leaderboardRequireGoogleSignIn,
  leaderboardPromotionMilestones: mutableMonetizationConfig.leaderboardPromotionMilestones,
};

function setSignedInAuthState(): void {
  useAuthStore.setState({
    status: 'signed-in',
    uid: 'tester',
    displayName: 'Tester',
    email: 'tester@example.com',
    firebaseDisplayName: 'Tester',
    photoURL: null,
    isAnonymous: false,
  });
}

function setEntitlementState(params: {
  purchaseStatus: 'none' | 'owned';
  subscriptionStatus: 'free' | 'pro';
}): void {
  useEntitlementStore.setState({
    purchaseStatus: params.purchaseStatus,
    subscriptionStatus: params.subscriptionStatus,
    isPro: params.subscriptionStatus === 'pro',
    proExpiresAt: null,
    planId: params.subscriptionStatus === 'pro' ? 'pro_monthly_099' : 'core_lifetime_099',
    lastCheckedAt: null,
  });
}

function renderHookHarness(): {
  getCurrent: () => LeaderboardAccessResult | null;
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let latest: LeaderboardAccessResult | null = null;

  function Harness() {
    latest = useLeaderboardAccess();
    return null;
  }

  act(() => {
    root.render(
      <MemoryRouter>
        <Harness />
      </MemoryRouter>
    );
  });

  return {
    getCurrent: () => latest,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

afterEach(() => {
  mutableMonetizationConfig.leaderboardPaywallEnabled =
    defaultConfigSnapshot.leaderboardPaywallEnabled;
  mutableMonetizationConfig.leaderboardRequireGoogleSignIn =
    defaultConfigSnapshot.leaderboardRequireGoogleSignIn;
  useEntitlementStore.getState().resetEntitlement();
  useAuthStore.getState().setSignedOut();
});

describe('useLeaderboardAccess', () => {
  it('returns open-access when paywall is disabled', () => {
    mutableMonetizationConfig.leaderboardPaywallEnabled = false;
    mutableMonetizationConfig.leaderboardRequireGoogleSignIn = true;
    setSignedInAuthState();
    setEntitlementState({ purchaseStatus: 'owned', subscriptionStatus: 'free' });

    const harness = renderHookHarness();
    const result = harness.getCurrent();
    harness.unmount();

    expect(result?.reason).toBe('open-access');
    expect(result?.canEnter).toBe(true);
    expect(result?.shouldShowJoinArena).toBe(false);
  });

  it('returns auth-required when sign-in is required but missing', () => {
    mutableMonetizationConfig.leaderboardPaywallEnabled = false;
    mutableMonetizationConfig.leaderboardRequireGoogleSignIn = true;
    useAuthStore.getState().setSignedOut();
    setEntitlementState({ purchaseStatus: 'owned', subscriptionStatus: 'pro' });

    const harness = renderHookHarness();
    const result = harness.getCurrent();
    harness.unmount();

    expect(result?.reason).toBe('auth-required');
    expect(result?.canEnter).toBe(false);
  });

  it('defers ladder entry while auth is loading', () => {
    mutableMonetizationConfig.leaderboardPaywallEnabled = false;
    useAuthStore.setState({
      status: 'loading',
      uid: null,
      isAnonymous: false,
    });
    setEntitlementState({ purchaseStatus: 'owned', subscriptionStatus: 'free' });

    const harness = renderHookHarness();
    const result = harness.getCurrent();
    harness.unmount();

    expect(result?.canEnter).toBe(false);
    expect(result?.reason).toBe('open-access');
  });

  it('returns pro-required and join-arena prompt when paywall is enabled', () => {
    mutableMonetizationConfig.leaderboardPaywallEnabled = true;
    mutableMonetizationConfig.leaderboardRequireGoogleSignIn = true;
    setSignedInAuthState();
    setEntitlementState({ purchaseStatus: 'owned', subscriptionStatus: 'free' });

    const harness = renderHookHarness();
    const result = harness.getCurrent();
    harness.unmount();

    expect(result?.reason).toBe('pro-required');
    expect(result?.canEnter).toBe(false);
    expect(result?.shouldShowJoinArena).toBe(true);
  });
});
