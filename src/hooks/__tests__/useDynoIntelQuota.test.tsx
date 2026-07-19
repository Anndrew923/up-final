/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { DYNO_INTEL_PRO_DAILY, DYNO_INTEL_TRIAL_DAILY } from '../../config/dynoIntel';
import { useAuthStore } from '../../stores/authStore';
import { useEntitlementStore } from '../../stores/entitlementStore';
import { useDynoIntelQuota, type DynoIntelQuotaState } from '../useDynoIntelQuota';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function setSignedIn(): void {
  useAuthStore.setState({
    status: 'signed-in',
    uid: 'quota-tester',
    displayName: 'Quota Tester',
    email: 'quota@example.com',
    firebaseDisplayName: 'Quota Tester',
    photoURL: null,
    isAnonymous: false,
  });
}

function setPro(active: boolean): void {
  useEntitlementStore.setState({
    purchaseStatus: 'owned',
    subscriptionStatus: active ? 'pro' : 'free',
    isPro: active,
    proExpiresAt: null,
    planId: active ? 'pro_monthly_099' : null,
    lastCheckedAt: null,
  });
}

function renderQuotaHook(): {
  getCurrent: () => DynoIntelQuotaState;
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let latest: DynoIntelQuotaState | null = null;

  function Harness() {
    latest = useDynoIntelQuota();
    return null;
  }

  act(() => {
    root.render(<Harness />);
  });

  return {
    getCurrent: () => {
      if (!latest) throw new Error('Quota hook did not render');
      return latest;
    },
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

afterEach(() => {
  useEntitlementStore.getState().resetEntitlement();
  useAuthStore.getState().setSignedOut();
  document.body.innerHTML = '';
});

describe('useDynoIntelQuota', () => {
  it('advertises the trial quota for a free user even when dev bypass is active', () => {
    setSignedIn();
    setPro(false);
    const harness = renderQuotaHook();

    expect(harness.getCurrent().remaining).toBe(DYNO_INTEL_TRIAL_DAILY);
    expect(harness.getCurrent().limit).toBe(DYNO_INTEL_TRIAL_DAILY);

    harness.unmount();
  });

  it('advertises the Pro quota only for an active Pro entitlement', () => {
    setSignedIn();
    setPro(true);
    const harness = renderQuotaHook();

    expect(harness.getCurrent().remaining).toBe(DYNO_INTEL_PRO_DAILY);
    expect(harness.getCurrent().limit).toBe(DYNO_INTEL_PRO_DAILY);

    harness.unmount();
  });

  it('clears a synced trial exhaustion when the user upgrades to Pro', () => {
    setSignedIn();
    setPro(false);
    const harness = renderQuotaHook();

    act(() => {
      harness.getCurrent().applyServerQuota({
        remaining: 0,
        limit: DYNO_INTEL_TRIAL_DAILY,
        resetAt: '2026-07-20T00:00:00.000Z',
      });
    });
    expect(harness.getCurrent().remaining).toBe(0);

    act(() => setPro(true));

    expect(harness.getCurrent().remaining).toBe(DYNO_INTEL_PRO_DAILY);
    expect(harness.getCurrent().limit).toBe(DYNO_INTEL_PRO_DAILY);
    expect(harness.getCurrent().resetAt).toBeNull();

    harness.unmount();
  });
});
