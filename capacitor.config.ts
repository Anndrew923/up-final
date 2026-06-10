import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor shell for Android (Google Play) + future iOS.
 * appId must match `android/app/google-services.json` package_name, Play Console, and RevenueCat.
 */
const config: CapacitorConfig = {
  appId: 'com.ultimatephysique.fitness2025',
  /**
   * WHY: Capacitor `appName` syncs to default `res/values/strings.xml` on `cap sync`.
   * Keep this as the short launcher brand (`UP`), not the full Play Store title.
   * zh-TW launcher label: `android/app/src/main/res/values-zh-rTW/strings.xml` (最強肉體).
   */
  appName: 'UP',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    buildOptions: {
      releaseType: 'AAB',
    },
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    },
  },
};

export default config;
