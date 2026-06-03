import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor shell for Android (Google Play) + future iOS.
 * appId must match `android/app/google-services.json` package_name, Play Console, and RevenueCat.
 */
const config: CapacitorConfig = {
  appId: 'com.ultimatephysique.fitness2025',
  /**
   * WHY: Capacitor `appName` is a single static string used at native sync time (launcher label on
   * default `res/values/strings.xml`). Web PWA uses locale manifests + `syncWebInstallBranding`;
   * that does NOT change the installed APK name. For Play Store zh-TW launcher text, add
   * `android/app/src/main/res/values-zh-rTW/strings.xml` with `app_name` / `title_activity_main`
   * — do not assume changing only the web manifest updates native Android branding.
   */
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
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    },
  },
};

export default config;
