import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor shell for Android (Google Play) + iOS (App Store / TestFlight).
 * appId must match `android/app/google-services.json` package_name, Play Console,
 * Xcode PRODUCT_BUNDLE_IDENTIFIER, and RevenueCat app identifiers.
 */
const config: CapacitorConfig = {
  appId: 'com.ultimatephysique.fitness2025',
  /**
   * WHY: Capacitor `appName` syncs to Android `res/values/strings.xml` on `cap sync`.
   * Keep this as the short launcher brand (`UP`), not the full Play Store title.
   * zh-TW launcher label: `android/app/src/main/res/values-zh-rTW/strings.xml` (最強肉體).
   * iOS display name is owned by `ios/App/App/Info.plist` → CFBundleDisplayName (最強肉體).
   */
  appName: 'UP',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  android: {
    buildOptions: {
      releaseType: 'AAB',
    },
  },
  ios: {
    // WHY: App already applies env(safe-area-inset-*) in shell/modals; automatic inset would double-pad.
    contentInset: 'never',
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      // WHY: apple.com loads native capability; UI surfaces Apple only via isNativeAppleSignInAvailable().
      providers: ['google.com', 'apple.com'],
    },
  },
};

export default config;
