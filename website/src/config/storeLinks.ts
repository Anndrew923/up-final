/**
 * Dual-store download SSOT for the marketing site.
 * WHY: Keep platform URLs + availability flags in one place so Navbar / modal / sticky CTA stay synced.
 */

export type StorePlatform = 'ios' | 'android';

export interface StoreLinkConfig {
  /** App Store product URL (or empty while pending review). */
  iosUrl: string;
  /** Google Play listing URL. */
  androidUrl: string;
  /** Bundle / package for display & Play manage links. */
  packageId: string;
  iosAvailable: boolean;
  androidAvailable: boolean;
  /** Marketing version badge. */
  appVersion: string;
}

export const storeLinks: StoreLinkConfig = {
  packageId: 'com.ultimatephysique.fitness2025',
  appVersion: '1.0.60',
  /** Set real App Store URL and flip iosAvailable when live. */
  iosUrl: '',
  androidUrl:
    'https://play.google.com/store/apps/details?id=com.ultimatephysique.fitness2025',
  iosAvailable: false,
  androidAvailable: true,
};

export function getStoreUrl(platform: StorePlatform): string | null {
  if (platform === 'ios') {
    if (!storeLinks.iosAvailable || !storeLinks.iosUrl) return null;
    return storeLinks.iosUrl;
  }
  if (!storeLinks.androidAvailable || !storeLinks.androidUrl) return null;
  return storeLinks.androidUrl;
}

export function detectMobilePlatform(): StorePlatform | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || navigator.vendor || '';
  if (/iPad|iPhone|iPod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}
