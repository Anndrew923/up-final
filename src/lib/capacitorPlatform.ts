import { Capacitor } from '@capacitor/core';

/** True when running inside Capacitor iOS/Android shell (not mobile browser). */
export function isCapacitorNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}
