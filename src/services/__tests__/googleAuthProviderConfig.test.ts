import { describe, expect, it } from 'vitest';
import { GoogleAuthProvider } from 'firebase/auth';
import {
  createGoogleAuthProvider,
  GOOGLE_SIGN_IN_ACCOUNT_PICKER_PARAMS,
} from '../googleAuthProviderConfig';

describe('googleAuthProviderConfig', () => {
  it('sets select_account on GoogleAuthProvider', () => {
    const provider = createGoogleAuthProvider();
    expect(provider).toBeInstanceOf(GoogleAuthProvider);
    expect(GOOGLE_SIGN_IN_ACCOUNT_PICKER_PARAMS).toEqual({ prompt: 'select_account' });
    const second = createGoogleAuthProvider();
    expect(second).not.toBe(provider);
  });
});
