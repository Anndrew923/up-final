/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DYNO_INTEL_PRO_DAILY, DYNO_INTEL_TRIAL_DAILY } from '../../config/dynoIntel';
import { useAuthStore } from '../../stores/authStore';
import { useEntitlementStore } from '../../stores/entitlementStore';
import { useDynoIntelQuota, type DynoIntelQuotaState } from '../useDynoIntelQuota';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const quotaStorage = new Map<string, string>();
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => quotaStorage.get(key) ?? null,
    setItem: (key: string, value: string) => quotaStorage.set(key, value),
    removeItem: (key: string) => quotaStorage.delete(key),
    clear: () => quotaStorage.clear(),
  },
});

function setSignedIn(uid = 'quota-tester'): void {
  useAuthStore.setState({
    status: 'signed-in',
    uid,
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
    proExpiresAt: active ? '2099-01-01T00:00:00.000Z' : null,
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
  window.localStorage.clear();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('useDynoIntelQuota', () => {
  it('advertises the trial quota for a free user even when dev bypass is active', () => {
    setSignedIn();
    setPro(false);
    const harness = renderQuotaHook();

    expect(harness.getCurrent().remaining).toBe(DYNO_INTEL_TRIAL_DAILY);
    expect(harness.getCurrent().limit).toBe(DYNO_INTEL_TRIAL_DAILY);
    expect(harness.getCurrent().isSynced).toBe(false);

    harness.unmount();
  });

  it('advertises the Pro quota only for an active Pro entitlement', () => {
    setSignedIn();
    setPro(true);
    const harness = renderQuotaHook();

    expect(harness.getCurrent().remaining).toBe(DYNO_INTEL_PRO_DAILY);
    expect(harness.getCurrent().limit).toBe(DYNO_INTEL_PRO_DAILY);
    expect(harness.getCurrent().isSynced).toBe(false);

    harness.unmount();
  });

  it('preserves consumed trial requests when the user upgrades to Pro', () => {
    setSignedIn();
    setPro(false);
    const harness = renderQuotaHook();

    act(() => {
      const current = harness.getCurrent();
      harness.getCurrent().applyServerQuota(
        {
          remaining: 0,
          limit: DYNO_INTEL_TRIAL_DAILY,
          quotaTier: 'trial',
          resetAt: '2099-01-01T00:00:00.000Z',
        },
        current.syncToken
      );
    });
    expect(harness.getCurrent().remaining).toBe(0);

    act(() => setPro(true));

    expect(harness.getCurrent().remaining).toBe(DYNO_INTEL_PRO_DAILY - DYNO_INTEL_TRIAL_DAILY);
    expect(harness.getCurrent().limit).toBe(DYNO_INTEL_PRO_DAILY);
    expect(harness.getCurrent().resetAt).toBe('2099-01-01T00:00:00.000Z');

    harness.unmount();
  });

  it('ignores a late response from a previous account session', () => {
    setSignedIn('account-a');
    setPro(false);
    const harness = renderQuotaHook();
    const staleToken = harness.getCurrent().syncToken;

    act(() => setSignedIn('account-b'));
    act(() => {
      harness.getCurrent().applyServerQuota(
        {
          remaining: 0,
          limit: DYNO_INTEL_TRIAL_DAILY,
          quotaTier: 'trial',
          resetAt: '2099-01-01T00:00:00.000Z',
        },
        staleToken
      );
    });

    expect(harness.getCurrent().remaining).toBe(DYNO_INTEL_TRIAL_DAILY);
    harness.unmount();
  });

  it('restores the latest server count after the console remounts', () => {
    setSignedIn();
    setPro(false);
    const first = renderQuotaHook();

    act(() => {
      const current = first.getCurrent();
      current.applyServerQuota(
        {
          remaining: 1,
          limit: DYNO_INTEL_TRIAL_DAILY,
          quotaTier: 'trial',
          resetAt: '2099-01-01T00:00:00.000Z',
        },
        current.syncToken
      );
    });
    first.unmount();

    const second = renderQuotaHook();
    expect(second.getCurrent().remaining).toBe(1);
    expect(second.getCurrent().limit).toBe(DYNO_INTEL_TRIAL_DAILY);
    expect(second.getCurrent().isSynced).toBe(true);
    second.unmount();
  });

  it('rejects an older same-day response that would increase remaining quota', () => {
    setSignedIn();
    setPro(false);
    const harness = renderQuotaHook();
    const token = harness.getCurrent().syncToken;
    const resetAt = '2099-01-01T00:00:00.000Z';

    act(() => {
      harness.getCurrent().applyServerQuota(
        {
          remaining: 0,
          limit: DYNO_INTEL_TRIAL_DAILY,
          quotaTier: 'trial',
          resetAt,
        },
        token
      );
      harness.getCurrent().applyServerQuota(
        {
          remaining: 1,
          limit: DYNO_INTEL_TRIAL_DAILY,
          quotaTier: 'trial',
          resetAt,
        },
        token
      );
    });

    expect(harness.getCurrent().remaining).toBe(0);
    harness.unmount();
  });

  it('automatically restores the local hint when the server reset time arrives', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-19T15:59:00.000Z'));
    setSignedIn();
    setPro(false);
    const harness = renderQuotaHook();

    act(() => {
      const current = harness.getCurrent();
      current.applyServerQuota(
        {
          remaining: 0,
          limit: DYNO_INTEL_TRIAL_DAILY,
          quotaTier: 'trial',
          resetAt: '2026-07-19T16:00:00.000Z',
        },
        current.syncToken
      );
    });
    expect(harness.getCurrent().remaining).toBe(0);

    act(() => vi.advanceTimersByTime(60_000));

    expect(harness.getCurrent().remaining).toBe(DYNO_INTEL_TRIAL_DAILY);
    expect(harness.getCurrent().resetAt).toBeNull();
    harness.unmount();
  });
});
