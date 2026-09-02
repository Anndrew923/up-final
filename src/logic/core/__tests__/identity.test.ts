import { describe, expect, it } from 'vitest';
import {
  APPLE_PRIVATE_RELAY_DISPLAY_NAME,
  getDisplayNameMaxLength,
  isApplePrivateRelayEmail,
  isRelayDerivedDisplayName,
  resolveDisplayName,
  resolveIdentityInitial,
} from '../identity';

const RELAY_EMAIL = 'jmdd5cwrwn@privaterelay.appleid.com';

describe('isApplePrivateRelayEmail', () => {
  it('detects privaterelay.appleid.com addresses', () => {
    expect(isApplePrivateRelayEmail(RELAY_EMAIL)).toBe(true);
    expect(isApplePrivateRelayEmail('pilot@gmail.com')).toBe(false);
  });
});

describe('resolveDisplayName', () => {
  it('prefers local ladder display name when set', () => {
    const result = resolveDisplayName({
      firebaseDisplayName: 'Google Pilot',
      email: 'pilot@example.com',
      localDisplayName: 'Arena Name',
    });
    expect(result).toBe('Arena Name');
  });

  it('falls back to firebase then email when local empty', () => {
    const result = resolveDisplayName({
      firebaseDisplayName: '   ',
      email: 'pilot@example.com',
      localDisplayName: '',
    });
    expect(result).toBe('pilot');
  });

  it('uses firebase when local is blank', () => {
    const result = resolveDisplayName({
      firebaseDisplayName: 'Google Pilot',
      email: 'pilot@example.com',
      localDisplayName: '   ',
    });
    expect(result).toBe('Google Pilot');
  });

  it('falls back to local display name when google/email unavailable', () => {
    const result = resolveDisplayName({
      firebaseDisplayName: null,
      email: '',
      localDisplayName: 'Local Name',
    });
    expect(result).toBe('Local Name');
  });

  it('uses default fallback when all sources empty', () => {
    const result = resolveDisplayName({});
    expect(result).toBe('未命名用戶');
  });

  it('enforces max display-name length', () => {
    const input = 'abcdefghijklmnopqrstuvwxyz';
    const result = resolveDisplayName({
      firebaseDisplayName: input,
    });
    expect(result).toHaveLength(getDisplayNameMaxLength());
    expect(result).toBe(input.slice(0, getDisplayNameMaxLength()));
  });

  it('uses player label for Apple Private Relay instead of relay local-part', () => {
    expect(
      resolveDisplayName({
        firebaseDisplayName: null,
        email: RELAY_EMAIL,
      })
    ).toBe(APPLE_PRIVATE_RELAY_DISPLAY_NAME);
  });

  it('skips firebase name when it matches relay local-part', () => {
    expect(
      resolveDisplayName({
        firebaseDisplayName: 'jmdd5cwrwn',
        email: RELAY_EMAIL,
      })
    ).toBe(APPLE_PRIVATE_RELAY_DISPLAY_NAME);
    expect(isRelayDerivedDisplayName('jmdd5cwrwn', RELAY_EMAIL)).toBe(true);
  });

  it('still prefers local ladder name over relay fallback', () => {
    expect(
      resolveDisplayName({
        localDisplayName: 'MyArenaName',
        email: RELAY_EMAIL,
      })
    ).toBe('MyArenaName');
  });

  it('does not treat normal Gmail as relay', () => {
    expect(
      resolveDisplayName({
        email: 'pilot@gmail.com',
      })
    ).toBe('pilot');
  });
});

describe('resolveIdentityInitial', () => {
  it('returns P for Private Relay player label', () => {
    expect(resolveIdentityInitial(APPLE_PRIVATE_RELAY_DISPLAY_NAME, RELAY_EMAIL)).toBe('P');
  });

  it('returns P when display name matches relay local-part', () => {
    expect(resolveIdentityInitial('jmdd5cwrwn', RELAY_EMAIL)).toBe('P');
  });

  it('uses ladder initial for custom local name on relay account', () => {
    expect(resolveIdentityInitial('MyArenaName', RELAY_EMAIL)).toBe('M');
  });

  it('uses ladder initial for normal email accounts', () => {
    expect(resolveIdentityInitial('pilot', 'pilot@gmail.com')).toBe('P');
  });

  it('returns false for relay-derived checks without relay email', () => {
    expect(isRelayDerivedDisplayName('jmdd5cwrwn', 'pilot@gmail.com')).toBe(false);
    expect(isRelayDerivedDisplayName('jmdd5cwrwn', null)).toBe(false);
  });
});
