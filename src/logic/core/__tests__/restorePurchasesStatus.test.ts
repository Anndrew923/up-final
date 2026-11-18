import { describe, expect, it } from 'vitest';
import {
  mapRestoreResultToStatus,
  RESTORE_PURCHASES_STATUS_I18N_KEY,
} from '../restorePurchasesStatus';

describe('mapRestoreResultToStatus', () => {
  it('maps restored + proActive to restore-ok', () => {
    expect(mapRestoreResultToStatus({ outcome: 'restored', proActive: true })).toBe('restore-ok');
  });

  it('maps no_receipt + proActive (cross-platform preserve) to restore-ok', () => {
    expect(mapRestoreResultToStatus({ outcome: 'no_receipt', proActive: true })).toBe('restore-ok');
  });

  it('maps empty / invalid / sync / fail outcomes', () => {
    expect(mapRestoreResultToStatus({ outcome: 'no_receipt', proActive: false })).toBe(
      'restore-empty'
    );
    expect(mapRestoreResultToStatus({ outcome: 'invalid_expiry', proActive: false })).toBe(
      'restore-invalid-expiry'
    );
    expect(mapRestoreResultToStatus({ outcome: 'sync_failed', proActive: false })).toBe(
      'restore-sync-failed'
    );
    expect(mapRestoreResultToStatus({ outcome: 'failed', proActive: false })).toBe('restore-fail');
    expect(mapRestoreResultToStatus({ outcome: 'restored', proActive: false })).toBe(
      'restore-fail'
    );
  });

  it('keeps i18n key map aligned with Settings copy', () => {
    expect(RESTORE_PURCHASES_STATUS_I18N_KEY['restore-ok']).toBe(
      'settings.restorePurchasesSuccess'
    );
    expect(RESTORE_PURCHASES_STATUS_I18N_KEY['restore-empty']).toBe(
      'settings.restorePurchasesEmpty'
    );
  });
});
