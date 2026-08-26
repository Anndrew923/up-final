import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { isIosNativePlatform } from '../lib/capacitorPlatform';

/**
 * Google Play subscription management deep link.
 * WHY: Store policy requires an in-app path to cancel/manage; Play owns the UI.
 */
export const PLAY_SUBSCRIPTION_MANAGE_URL =
  'https://play.google.com/store/account/subscriptions?sku=up_pro_monthly&package=com.ultimatephysique.fitness2025';

/**
 * App Store subscriptions management (system sheet / Safari).
 * WHY: Apple requires a path to manage/cancel; never deep-link Play URLs on iOS.
 */
export const APP_STORE_SUBSCRIPTION_MANAGE_URL = 'https://apps.apple.com/account/subscriptions';

/** Resolves the correct store manage URL for the current Capacitor platform. */
export function resolveStoreSubscriptionManageUrl(): string {
  // WHY: Default non-iOS (Android shell + web) to Play — avoids accidental App Store links on Android.
  return isIosNativePlatform() ? APP_STORE_SUBSCRIPTION_MANAGE_URL : PLAY_SUBSCRIPTION_MANAGE_URL;
}

/** Opens Play or App Store subscription management (native Browser) or web fallback. */
export async function openStoreSubscriptionManagement(): Promise<void> {
  const url = resolveStoreSubscriptionManageUrl();
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}
