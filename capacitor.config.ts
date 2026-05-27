import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor shell for Android (Google Play) + future iOS.
 * appId must match `android/app/google-services.json` package_name, Play Console, and RevenueCat.
 */
const config: CapacitorConfig = {
  appId: 'com.ultimatephysique.fitness2025',
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
