import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EntitlementState } from '../../types/entitlement';
import { useEntitlementStore } from '../../stores/entitlementStore';

vi.mock('../userStructuredSyncService', () => ({
  canRunStructuredUserSync: vi.fn(),
  probeStructuredCloudStatus: vi.fn(),
  runStructuredBackup: vi.fn(),
  runStructuredRestore: vi.fn(),
}));

import * as structured from '../userStructuredSyncService';
import {
  backupLocalToCloud,
  fetchCloudSyncStatus,
  restoreCloudToLocal,
} from '../cloudSyncService';

function proEntitlement(): EntitlementState {
  return {
    purchaseStatus: 'owned',
    subscriptionStatus: 'pro',
    isPro: true,
    proExpiresAt: null,
    promoExpiresAt: null,
    planId: 'pro_monthly_099',
    lastCheckedAt: null,
    proPurchaseCooldownUntil: null,
    isGenesisEarlyBird: false,
    genesisSeatNumber: null,
  };
}

describe('cloudSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEntitlementStore.getState().hydrateEntitlement(proEntitlement());
  });

  it('fetchCloudSyncStatus skips Firestore probe when structured sync cannot run', async () => {
    vi.mocked(structured.canRunStructuredUserSync).mockReturnValue(false);
    const r = await fetchCloudSyncStatus();
    expect(r).toEqual({ exists: false, cloudUpdatedAt: null });
    expect(structured.probeStructuredCloudStatus).not.toHaveBeenCalled();
  });

  it('fetchCloudSyncStatus returns probe result for eligible Pro session', async () => {
    vi.mocked(structured.canRunStructuredUserSync).mockReturnValue(true);
    vi.mocked(structured.probeStructuredCloudStatus).mockResolvedValue({
      exists: true,
      cloudUpdatedAt: '2026-10-10T10:30:00.000Z',
    });
    const r = await fetchCloudSyncStatus();
    expect(r).toEqual({
      exists: true,
      cloudUpdatedAt: '2026-10-10T10:30:00.000Z',
    });
    expect(structured.probeStructuredCloudStatus).toHaveBeenCalledTimes(1);
  });

  it('fetchCloudSyncStatus returns empty status when probe throws', async () => {
    vi.mocked(structured.canRunStructuredUserSync).mockReturnValue(true);
    vi.mocked(structured.probeStructuredCloudStatus).mockRejectedValue(
      new Error('cloud-auth-required')
    );
    const r = await fetchCloudSyncStatus();
    expect(r).toEqual({ exists: false, cloudUpdatedAt: null });
  });

  it('backup returns unavailable when structured sync cannot run', async () => {
    vi.mocked(structured.canRunStructuredUserSync).mockReturnValue(false);
    const r = await backupLocalToCloud();
    expect(r).toEqual({ ok: false, reason: 'unavailable' });
    expect(structured.runStructuredBackup).not.toHaveBeenCalled();
  });

  it('backup returns permission-denied when Firestore rejects write', async () => {
    vi.mocked(structured.canRunStructuredUserSync).mockReturnValue(true);
    vi.mocked(structured.runStructuredBackup).mockRejectedValue({ code: 'permission-denied' });
    const r = await backupLocalToCloud();
    expect(r).toEqual({ ok: false, reason: 'permission-denied' });
  });

  it('backup returns auth-failed on cloud-auth-required', async () => {
    vi.mocked(structured.canRunStructuredUserSync).mockReturnValue(true);
    vi.mocked(structured.runStructuredBackup).mockRejectedValue(new Error('cloud-auth-required'));
    const r = await backupLocalToCloud();
    expect(r).toEqual({ ok: false, reason: 'auth-failed' });
  });

  it('backup succeeds when structured backup completes', async () => {
    vi.mocked(structured.canRunStructuredUserSync).mockReturnValue(true);
    vi.mocked(structured.runStructuredBackup).mockResolvedValue(undefined);
    const r = await backupLocalToCloud();
    expect(r).toEqual({ ok: true });
    expect(structured.runStructuredBackup).toHaveBeenCalledTimes(1);
  });

  it('restore returns unavailable when structured sync cannot run', async () => {
    vi.mocked(structured.canRunStructuredUserSync).mockReturnValue(false);
    const r = await restoreCloudToLocal();
    expect(r).toEqual({ ok: false, reason: 'unavailable' });
  });

  it('restore returns empty-restore when remote has no structured profile', async () => {
    vi.mocked(structured.canRunStructuredUserSync).mockReturnValue(true);
    vi.mocked(structured.runStructuredRestore).mockResolvedValue(false);
    const r = await restoreCloudToLocal();
    expect(r).toEqual({ ok: false, reason: 'empty-restore' });
  });

  it('restore succeeds when structured restore completes', async () => {
    vi.mocked(structured.canRunStructuredUserSync).mockReturnValue(true);
    vi.mocked(structured.runStructuredRestore).mockResolvedValue(true);
    const r = await restoreCloudToLocal();
    expect(r).toEqual({ ok: true });
  });
});
