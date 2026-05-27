import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor shell for Android (Google Play) + future iOS.
 * appId must match Play Console package name and RevenueCat Android app id.
 */
const config: CapacitorConfig = {
  appId: 'com.ultimatephysique.app',
  appName: 'Ultimate Physique',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    buildOptions: {
      releaseType: 'AAB',
    },
  },
};

export default config;
