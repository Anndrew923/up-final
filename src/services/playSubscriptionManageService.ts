import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

/**
 * Google Play subscription management deep link.
 * WHY: Store policy requires an in-app path to cancel/manage; Play owns the UI.
 */
export const PLAY_SUBSCRIPTION_MANAGE_URL =
  'https://play.google.com/store/account/subscriptions?sku=up_pro_monthly&package=com.ultimatephysique.fitness2025';

/** Opens Play subscription management (native Browser) or web fallback. */
export async function openPlaySubscriptionManagement(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url: PLAY_SUBSCRIPTION_MANAGE_URL });
    return;
  }
  window.open(PLAY_SUBSCRIPTION_MANAGE_URL, '_blank', 'noopener,noreferrer');
}
