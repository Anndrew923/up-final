import { Capacitor } from '@capacitor/core';
import {
  LOG_LEVEL,
  Purchases,
  type CustomerInfo,
  type PurchasesConfiguration,
  type PurchasesOffering,
  type PurchasesPackage,
} from '@revenuecat/purchases-capacitor';

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

function packageId(): string {
  return env('VITE_RC_PACKAGE_ID') || '$rc_monthly';
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

export async function fetchRevenueCatEntitlement(appUserId: string): Promise<RevenueCatEntitlementSnapshot | null> {
  const ok = await ensureRevenueCatConfigured(appUserId);
  if (!ok) return null;
  const { customerInfo } = await Purchases.getCustomerInfo();
  return parseEntitlement(customerInfo);
}

function resolvePurchasePackage(offering: PurchasesOffering): PurchasesPackage | null {
  if (offering.availablePackages.length === 0) return null;
  const preferredId = packageId();
  return (
    offering.availablePackages.find((item) => item.identifier === preferredId) ??
    offering.monthly ??
    offering.availablePackages[0]
  );
}

export async function purchaseRevenueCatPro(appUserId: string): Promise<RevenueCatEntitlementSnapshot | null> {
  const ok = await ensureRevenueCatConfigured(appUserId);
  if (!ok) return null;
  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  if (!current) return null;
  const targetPackage = resolvePurchasePackage(current);
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

