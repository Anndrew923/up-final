import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEntitlementStore } from '../entitlementStore';

const resolveServerProHydrate = vi.hoisted(() => vi.fn());
const shouldPreserveLocalProAgainstInactiveStore = vi.hoisted(() => vi.fn());

vi.mock('../../services/userEntitlementService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/userEntitlementService')>();
  return {
    ...actual,
    resolveServerProHydrate,
    shouldPreserveLocalProAgainstInactiveStore,
  };
});

const revenueCat = vi.hoisted(() => ({
  isRevenueCatNativeBillingAvailable: vi.fn(() => false),
  logInRevenueCatUser: vi.fn(),
  fetchRevenueCatEntitlement: vi.fn(),
}));

const syncProEntitlementToServer = vi.hoisted(() => vi.fn());

vi.mock('../../services/revenueCatService', () => ({
  isRevenueCatNativeBillingAvailable: revenueCat.isRevenueCatNativeBillingAvailable,
  logInRevenueCatUser: revenueCat.logInRevenueCatUser,
  fetchRevenueCatEntitlement: revenueCat.fetchRevenueCatEntitlement,
}));

vi.mock('../../services/subscriptionSyncService', () => ({
  syncProEntitlementToServer,
}));

vi.mock('../authStore', () => ({
  useAuthStore: {
    getState: () => ({ uid: 'test-user' }),
  },
}));

describe('entitlementStore', () => {
  beforeEach(() => {
    resolveServerProHydrate.mockReset();
    resolveServerProHydrate.mockResolvedValue({ status: 'skipped', reason: 'doc-missing' });
    shouldPreserveLocalProAgainstInactiveStore.mockReset();
    shouldPreserveLocalProAgainstInactiveStore.mockResolvedValue(false);
    revenueCat.isRevenueCatNativeBillingAvailable.mockReturnValue(false);
    revenueCat.fetchRevenueCatEntitlement.mockReset();
    syncProEntitlementToServer.mockReset();
    useEntitlementStore.getState().resetEntitlement();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('folds expired grace to expired and clears isPro', () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    useEntitlementStore.getState().setSubscriptionStatus('grace');
    useEntitlementStore.getState().setProExpiry(past);

    const state = useEntitlementStore.getState();
    expect(state.subscriptionStatus).toBe('expired');
    expect(state.isPro).toBe(false);
  });

  it('keeps isPro true for active grace with future expiry', () => {
    const future = new Date(Date.now() + 3_600_000).toISOString();
    useEntitlementStore.getState().hydrateEntitlement({
      subscriptionStatus: 'grace',
      proExpiresAt: future,
    });

    expect(useEntitlementStore.getState().subscriptionStatus).toBe('grace');
    expect(useEntitlementStore.getState().isPro).toBe(true);
  });

  it('keeps the debug Pro setter internally consistent with an expiry', () => {
    useEntitlementStore.getState().setSubscriptionStatus('pro');

    const state = useEntitlementStore.getState();
    expect(state.subscriptionStatus).toBe('pro');
    expect(state.isPro).toBe(true);
    expect(Date.parse(state.proExpiresAt ?? '')).toBeGreaterThan(Date.now());
  });

  it('applyRevenueCatEntitlement sets pro and expiry from snapshot', () => {
    const expires = new Date(Date.now() + 86_400_000).toISOString();
    useEntitlementStore.getState().applyRevenueCatEntitlement({
      active: true,
      productIdentifier: 'rc_monthly_sandbox',
      expiresDate: expires,
    });

    const state = useEntitlementStore.getState();
    expect(state.subscriptionStatus).toBe('pro');
    expect(state.isPro).toBe(true);
    expect(state.planId).toBe('rc_monthly_sandbox');
    expect(state.proExpiresAt).toBe(expires);
  });

  it('revokes an active Pro snapshot when its expiry passes in-session', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-19T10:00:00.000Z'));
    useEntitlementStore.getState().applyRevenueCatEntitlement({
      active: true,
      productIdentifier: 'pro_monthly_099',
      expiresDate: '2026-07-19T10:01:00.000Z',
    });

    vi.advanceTimersByTime(60_001);

    expect(useEntitlementStore.getState().subscriptionStatus).toBe('expired');
    expect(useEntitlementStore.getState().isPro).toBe(false);
  });

  it('bindEntitlementSession clears pro carryover for a new uid', () => {
    useEntitlementStore.getState().applyRevenueCatEntitlement({
      active: true,
      productIdentifier: 'pro_monthly_099',
      expiresDate: new Date(Date.now() + 86_400_000).toISOString(),
    });
    expect(useEntitlementStore.getState().isPro).toBe(true);
    expect(useEntitlementStore.getState().lastCheckedAt).toBeTruthy();

    useEntitlementStore.getState().bindEntitlementSession('new-user');
    expect(useEntitlementStore.getState().isPro).toBe(false);
    expect(useEntitlementStore.getState().subscriptionStatus).toBe('free');
    // WHY: Prior session's lastCheckedAt must not look settled before this uid's RC refresh.
    expect(useEntitlementStore.getState().lastCheckedAt).toBeNull();
  });

  it('defaults and normalizes purchaseStatus to owned (download-includes-Core)', () => {
    useEntitlementStore.getState().resetEntitlement();
    expect(useEntitlementStore.getState().purchaseStatus).toBe('owned');

    useEntitlementStore.getState().setPurchaseStatus('none');
    expect(useEntitlementStore.getState().purchaseStatus).toBe('owned');
  });

  it('commitServerProEntitlement arms cooldown and blocks inactive reconcile downgrade', () => {
    useEntitlementStore.getState().commitServerProEntitlement({
      subscriptionStatus: 'pro',
      proExpiresAt: '2099-01-01T00:00:00.000Z',
      planId: 'up_pro_monthly',
      armPurchaseCooldown: true,
    });

    const committed = useEntitlementStore.getState();
    expect(committed.isPro).toBe(true);
    expect(committed.proPurchaseCooldownUntil).toBeTruthy();

    useEntitlementStore.getState().applyRevenueCatEntitlement({
      active: false,
      productIdentifier: null,
      expiresDate: null,
    });

    const guarded = useEntitlementStore.getState();
    expect(guarded.isPro).toBe(true);
    expect(guarded.subscriptionStatus).toBe('pro');
    expect(guarded.proExpiresAt).toBe('2099-01-01T00:00:00.000Z');
  });

  it('commitServerProEntitlement without armPurchaseCooldown leaves cooldown unset', () => {
    useEntitlementStore.getState().commitServerProEntitlement({
      subscriptionStatus: 'pro',
      proExpiresAt: '2099-01-01T00:00:00.000Z',
      planId: 'up_pro_monthly',
      armPurchaseCooldown: false,
    });

    expect(useEntitlementStore.getState().isPro).toBe(true);
    expect(useEntitlementStore.getState().proPurchaseCooldownUntil).toBeNull();
  });

  it('hydrateServerProFromFirestore unlocks Pro from Firestore on empty local cache', async () => {
    useEntitlementStore.getState().bindEntitlementSession('ios-user');
    expect(useEntitlementStore.getState().isPro).toBe(false);

    resolveServerProHydrate.mockResolvedValue({
      status: 'active',
      entitlement: {
        subscriptionStatus: 'pro',
        proExpiresAt: '2099-01-01T00:00:00.000Z',
        planId: 'up_pro_monthly',
      },
    });

    const hydrated = await useEntitlementStore.getState().hydrateServerProFromFirestore('ios-user');
    expect(hydrated).toBe(true);
    expect(useEntitlementStore.getState().isPro).toBe(true);
    expect(useEntitlementStore.getState().subscriptionStatus).toBe('pro');
  });

  it('hydrateServerProFromFirestore clears stale local Pro when Firestore revoked', async () => {
    useEntitlementStore.getState().bindEntitlementSession('ios-user');
    useEntitlementStore.getState().commitServerProEntitlement({
      subscriptionStatus: 'pro',
      proExpiresAt: '2099-01-01T00:00:00.000Z',
      planId: 'up_pro_monthly',
      armPurchaseCooldown: false,
    });
    resolveServerProHydrate.mockResolvedValue({ status: 'revoked' });

    const hydrated = await useEntitlementStore.getState().hydrateServerProFromFirestore('ios-user');

    expect(hydrated).toBe(false);
    expect(useEntitlementStore.getState().isPro).toBe(false);
    expect(useEntitlementStore.getState().subscriptionStatus).toBe('free');
  });

  it('refreshEntitlement keeps cloud Pro when RevenueCat snapshot is inactive', async () => {
    useEntitlementStore.getState().bindEntitlementSession('test-user');
    useEntitlementStore.getState().commitServerProEntitlement({
      subscriptionStatus: 'pro',
      proExpiresAt: '2099-01-01T00:00:00.000Z',
      planId: 'up_pro_monthly',
      armPurchaseCooldown: false,
    });

    revenueCat.isRevenueCatNativeBillingAvailable.mockReturnValue(true);
    revenueCat.fetchRevenueCatEntitlement.mockResolvedValue({
      active: false,
      productIdentifier: null,
      expiresDate: null,
    });
    resolveServerProHydrate.mockResolvedValue({
      status: 'active',
      entitlement: {
        subscriptionStatus: 'pro',
        proExpiresAt: '2099-01-01T00:00:00.000Z',
        planId: 'up_pro_monthly',
      },
    });
    shouldPreserveLocalProAgainstInactiveStore.mockResolvedValue(true);

    await useEntitlementStore.getState().refreshEntitlement();

    expect(useEntitlementStore.getState().isPro).toBe(true);
    expect(useEntitlementStore.getState().subscriptionStatus).toBe('pro');
    expect(syncProEntitlementToServer).not.toHaveBeenCalled();
  });

  it('refreshEntitlement clears local Pro when Firestore revoked despite inactive RC', async () => {
    useEntitlementStore.getState().bindEntitlementSession('test-user');
    useEntitlementStore.getState().commitServerProEntitlement({
      subscriptionStatus: 'pro',
      proExpiresAt: '2099-01-01T00:00:00.000Z',
      planId: 'up_pro_monthly',
      armPurchaseCooldown: false,
    });

    revenueCat.isRevenueCatNativeBillingAvailable.mockReturnValue(true);
    revenueCat.fetchRevenueCatEntitlement.mockResolvedValue({
      active: false,
      productIdentifier: null,
      expiresDate: null,
    });
    resolveServerProHydrate.mockResolvedValue({ status: 'revoked' });
    shouldPreserveLocalProAgainstInactiveStore.mockResolvedValue(false);

    await useEntitlementStore.getState().refreshEntitlement();

    expect(useEntitlementStore.getState().isPro).toBe(false);
    expect(useEntitlementStore.getState().subscriptionStatus).toBe('free');
  });

  it('applyRevenueCatEntitlement does not downgrade valid cloud Pro when RC is inactive', () => {
    useEntitlementStore.getState().commitServerProEntitlement({
      subscriptionStatus: 'pro',
      proExpiresAt: '2099-01-01T00:00:00.000Z',
      planId: 'up_pro_monthly',
      armPurchaseCooldown: false,
    });

    useEntitlementStore.getState().applyRevenueCatEntitlement({
      active: false,
      productIdentifier: null,
      expiresDate: null,
    });

    const state = useEntitlementStore.getState();
    expect(state.isPro).toBe(true);
    expect(state.subscriptionStatus).toBe('pro');
    expect(state.proExpiresAt).toBe('2099-01-01T00:00:00.000Z');
  });

  it('refreshEntitlement clears isRefreshing and stamps lastCheckedAt when idle', async () => {
    useEntitlementStore.getState().bindEntitlementSession('test-user');
    expect(useEntitlementStore.getState().isRefreshing).toBe(false);
    await useEntitlementStore.getState().refreshEntitlement();
    expect(useEntitlementStore.getState().isRefreshing).toBe(false);
    expect(useEntitlementStore.getState().lastCheckedAt).toBeTruthy();
  });

  it('resetEntitlement clears isRefreshing', () => {
    useEntitlementStore.setState({ isRefreshing: true });
    useEntitlementStore.getState().resetEntitlement();
    expect(useEntitlementStore.getState().isRefreshing).toBe(false);
  });
});
