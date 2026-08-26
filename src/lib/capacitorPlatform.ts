import { Capacitor } from '@capacitor/core';

/** True when running inside Capacitor iOS/Android shell (not mobile browser). */
export function isCapacitorNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/** True only inside the Capacitor iOS shell (not Android, not mobile Safari). */
export function isIosNativePlatform(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

/** True only inside the Capacitor Android shell. */
export function isAndroidNativePlatform(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}
