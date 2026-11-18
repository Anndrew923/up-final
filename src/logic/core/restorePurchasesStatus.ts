/**
 * Shared restore UI statuses — Settings banners + paywall footers stay aligned.
 * WHY: Outcome → copy mapping must not diverge across Guideline 3.1.2 surfaces.
 */

export type RestorePurchasesOutcomeLike =
  | 'restored'
  | 'no_receipt'
  | 'invalid_expiry'
  | 'sync_failed'
  | 'failed';

/** Minimal restore result shape — keeps logic free of service-layer imports. */
export type RestorePurchasesResultLike = {
  outcome: RestorePurchasesOutcomeLike;
  proActive: boolean;
};

export type RestorePurchasesStatus =
  | 'idle'
  | 'restore-ok'
  | 'restore-empty'
  | 'restore-invalid-expiry'
  | 'restore-sync-failed'
  | 'restore-fail';

/** i18n keys under `common` for restore feedback (Settings + paywalls). */
export const RESTORE_PURCHASES_STATUS_I18N_KEY: Record<
  Exclude<RestorePurchasesStatus, 'idle'>,
  string
> = {
  'restore-ok': 'settings.restorePurchasesSuccess',
  'restore-empty': 'settings.restorePurchasesEmpty',
  'restore-invalid-expiry': 'settings.restorePurchasesInvalidExpiry',
  'restore-sync-failed': 'settings.restorePurchasesSyncFailed',
  'restore-fail': 'settings.restorePurchasesFail',
};

export function mapRestoreResultToStatus(
  result: RestorePurchasesResultLike
): Exclude<RestorePurchasesStatus, 'idle'> {
  if (result.outcome === 'restored' && result.proActive) return 'restore-ok';
  if (result.outcome === 'no_receipt' && result.proActive) return 'restore-ok';
  if (result.outcome === 'invalid_expiry') return 'restore-invalid-expiry';
  if (result.outcome === 'sync_failed') return 'restore-sync-failed';
  if (result.outcome === 'no_receipt') return 'restore-empty';
  return 'restore-fail';
}
