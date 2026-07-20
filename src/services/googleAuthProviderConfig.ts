import { GoogleAuthProvider } from 'firebase/auth';

/** OAuth hint — always show Google's account chooser (web popup/redirect). */
export const GOOGLE_SIGN_IN_ACCOUNT_PICKER_PARAMS = { prompt: 'select_account' } as const;

/** Capacitor Firebase Auth `customParameters` shape (parity with web OAuth). */
export const GOOGLE_SIGN_IN_ACCOUNT_PICKER_CUSTOM_PARAMETERS = [
  { key: 'prompt', value: 'select_account' },
] as const;

/**
 * WHY: Browsers cache the last Google account in OAuth unless `prompt=select_account`
 * is set — required for multi-account testing and explicit account switches.
 */
export function createGoogleAuthProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters(GOOGLE_SIGN_IN_ACCOUNT_PICKER_PARAMS);
  return provider;
}
