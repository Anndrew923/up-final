import { Capacitor } from '@capacitor/core';
import {
  LOG_LEVEL,
  Purchases,
  type CustomerInfo,
  type PurchasesConfiguration,
  type PurchasesOffering,
  type PurchasesPackage,
} from '@revenuecat/purchases-capacitor';
import {
  DEFAULT_PRO_SUBSCRIPTION_PLAN,
  PRO_SUBSCRIPTION_PLANS,
  type ProSubscriptionPlanId,
} from '../config/proSubscriptionPlans';
import { normalizePromoCode } from '../logic/core/promoCode';
import { safeGetItem, safeSetItem } from '../lib/safeLocalStorage';

export interface RevenueCatEntitlementSnapshot {
  active: boolean;
  productIdentifier: string | null;
  expiresDate: string | null;
}

let configuredForUser: string | null = null;
let configureInFlight: Promise<boolean> | null = null;

function env(name: keyof ImportMetaEnv): string {
  const raw = import.meta.env[name];
  return typeof raw === 'string' ? raw.trim() : '';
}

function resolveApiKey(): string {
  if (Capacitor.getPlatform() === 'ios') {
    return env('VITE_RC_API_KEY_IOS');
  }
  if (Capacitor.getPlatform() === 'android') {
    return env('VITE_RC_API_KEY_ANDROID');
  }
  return env('VITE_RC_API_KEY_WEB');
}

function entitlementId(): string {
  return env('VITE_RC_ENTITLEMENT_ID') || 'pro';
}

function defaultPackageId(): string {
  return env('VITE_RC_PACKAGE_ID') || PRO_SUBSCRIPTION_PLANS.monthly.packageId;
}

function parseEntitlement(info: CustomerInfo): RevenueCatEntitlementSnapshot {
  const id = entitlementId();
  const active = info.entitlements.active?.[id];
  if (!active) {
    return {
      active: false,
      productIdentifier: null,
      expiresDate: null,
    };
  }
  return {
    active: true,
    productIdentifier: active.productIdentifier ?? null,
    expiresDate: active.expirationDate ?? null,
  };
}

export function isRevenueCatConfiguredFromEnv(): boolean {
  return Boolean(resolveApiKey());
}

/** Store billing via `@revenuecat/purchases-capacitor` — iOS/Android only (not browser). */
export function isRevenueCatNativeBillingAvailable(): boolean {
  return isRevenueCatConfiguredFromEnv() && Capacitor.isNativePlatform();
}

export async function ensureRevenueCatConfigured(appUserId: string): Promise<boolean> {
  if (!isRevenueCatConfiguredFromEnv()) return false;
  if (!Capacitor.isNativePlatform()) return false;
  if (configuredForUser === appUserId) return true;
  if (configureInFlight) return configureInFlight;

  configureInFlight = (async () => {
    const apiKey = resolveApiKey();
    const config: PurchasesConfiguration = { apiKey, appUserID: appUserId };
    await Purchases.setLogLevel({
      level: import.meta.env.DEV ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO,
    });
    await Purchases.configure(config);
    configuredForUser = appUserId;
    return true;
  })();

  try {
    return await configureInFlight;
  } finally {
    configureInFlight = null;
  }
}

export async function logInRevenueCatUser(appUserId: string): Promise<void> {
  const ok = await ensureRevenueCatConfigured(appUserId);
  if (!ok) return;
  const current = await Purchases.getAppUserID();
  if (current.appUserID !== appUserId) {
    await Purchases.logIn({ appUserID: appUserId });
  }
}

export async function fetchRevenueCatEntitlement(
  appUserId: string
): Promise<RevenueCatEntitlementSnapshot | null> {
  const ok = await ensureRevenueCatConfigured(appUserId);
  if (!ok) return null;
  const { customerInfo } = await Purchases.getCustomerInfo();
  return parseEntitlement(customerInfo);
}

function resolvePackageId(planId?: ProSubscriptionPlanId | string | null): string {
  if (planId === 'monthly' || planId === PRO_SUBSCRIPTION_PLANS.monthly.packageId) {
    return PRO_SUBSCRIPTION_PLANS.monthly.packageId;
  }
  if (planId === 'annual' || planId === PRO_SUBSCRIPTION_PLANS.annual.packageId) {
    return PRO_SUBSCRIPTION_PLANS.annual.packageId;
  }
  if (typeof planId === 'string' && planId.trim()) return planId.trim();
  return defaultPackageId();
}

function resolvePurchasePackage(
  offering: PurchasesOffering,
  preferredPackageId: string
): PurchasesPackage | null {
  if (offering.availablePackages.length === 0) return null;
  const byId = offering.availablePackages.find((item) => item.identifier === preferredPackageId);
  if (byId) return byId;
  if (preferredPackageId === PRO_SUBSCRIPTION_PLANS.annual.packageId && offering.annual) {
    return offering.annual;
  }
  if (preferredPackageId === PRO_SUBSCRIPTION_PLANS.monthly.packageId && offering.monthly) {
    return offering.monthly;
  }
  return offering.monthly ?? offering.availablePackages[0];
}

/**
 * Purchases the selected Pro package from the current offering.
 * @param planOrPackageId `monthly` | `annual` | `$rc_monthly` | `$rc_annual` (default annual for new paywall).
 */
export async function purchaseRevenueCatPro(
  appUserId: string,
  planOrPackageId: ProSubscriptionPlanId | string = DEFAULT_PRO_SUBSCRIPTION_PLAN
): Promise<RevenueCatEntitlementSnapshot | null> {
  const ok = await ensureRevenueCatConfigured(appUserId);
  if (!ok) return null;
  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  if (!current) return null;
  const targetPackage = resolvePurchasePackage(current, resolvePackageId(planOrPackageId));
  if (!targetPackage) return null;
  const result = await Purchases.purchasePackage({ aPackage: targetPackage });
  return parseEntitlement(result.customerInfo);
}

export async function restoreRevenueCatPurchases(
  appUserId: string
): Promise<RevenueCatEntitlementSnapshot | null> {
  const ok = await ensureRevenueCatConfigured(appUserId);
  if (!ok) return null;
  const result = await Purchases.restorePurchases();
  return parseEntitlement(result.customerInfo);
}

/** Dashboard / analytics tag only — not the commission ledger SSOT. */
export const RC_REFERRER_ATTRIBUTE_KEY = 'referrer';
const RC_REFERRER_SYNC_PREFIX = 'up.final.rcReferrer.v1';

function referrerSyncStorageKey(uid: string): string {
  return `${RC_REFERRER_SYNC_PREFIX}:${uid}`;
}

export function readLocallySyncedReferrer(uid: string): string | null {
  if (!uid) return null;
  const stored = normalizePromoCode(safeGetItem(referrerSyncStorageKey(uid)) ?? '');
  return stored || null;
}

function hasLocallySyncedReferrer(uid: string, code: string): boolean {
  const clean = normalizePromoCode(code);
  if (!uid || !clean) return false;
  return readLocallySyncedReferrer(uid) === clean;
}

function markLocallySyncedReferrer(uid: string, code: string): void {
  const clean = normalizePromoCode(code);
  if (!uid || !clean) return;
  safeSetItem(referrerSyncStorageKey(uid), clean);
}

/**
 * Writes RevenueCat subscriber attribute `referrer`.
 * Native-only, never throws — dashboard tag must not block redeem / session bind.
 * Capacitor 13 has no `setSubscriberAttribute`; `setAttributes({ referrer })` is the SDK equivalent.
 *
 * @param appUserId Firebase uid. Prefer passing it so tagging does not depend on a prior `logIn`.
 */
export async function setReferrerAttribute(code: string, appUserId?: string): Promise<void> {
  const clean = normalizePromoCode(code);
  if (!clean) return;
  try {
    if (!isRevenueCatNativeBillingAvailable()) return;
    const uid = (typeof appUserId === 'string' && appUserId.trim()) || configuredForUser;
    if (!uid) return;
    if (hasLocallySyncedReferrer(uid, clean)) return;
    const ok = await ensureRevenueCatConfigured(uid);
    if (!ok) return;
    await Purchases.setAttributes({ [RC_REFERRER_ATTRIBUTE_KEY]: clean });
    markLocallySyncedReferrer(uid, clean);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[revenuecat] setReferrerAttribute failed', { message });
  }
}
