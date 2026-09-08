/* @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const memory = new Map<string, string>();
const isNativePlatform = vi.hoisted(() => vi.fn(() => false));
const getPlatform = vi.hoisted(() => vi.fn(() => 'ios'));
const setAttributes = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const configure = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const setLogLevel = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const getAppUserID = vi.hoisted(() => vi.fn().mockResolvedValue({ appUserID: 'uid-1' }));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform, getPlatform },
}));

vi.mock('@revenuecat/purchases-capacitor', () => ({
  LOG_LEVEL: { DEBUG: 'DEBUG', INFO: 'INFO' },
  Purchases: {
    setLogLevel,
    configure,
    getAppUserID,
    logIn: vi.fn().mockResolvedValue(undefined),
    setAttributes,
    getCustomerInfo: vi.fn(),
    getOfferings: vi.fn(),
    purchasePackage: vi.fn(),
    restorePurchases: vi.fn(),
  },
}));

vi.mock('../../lib/safeLocalStorage', () => ({
  safeGetItem: (key: string) => memory.get(key) ?? null,
  safeSetItem: (key: string, value: string) => {
    memory.set(key, value);
    return true;
  },
  safeRemoveItem: (key: string) => {
    memory.delete(key);
  },
}));

const { logInRevenueCatUser, setReferrerAttribute, readLocallySyncedReferrer, RC_REFERRER_ATTRIBUTE_KEY } =
  await import('../revenueCatService');

describe('setReferrerAttribute', () => {
  beforeEach(() => {
    memory.clear();
    vi.stubEnv('VITE_RC_API_KEY_IOS', 'test-ios-key');
    isNativePlatform.mockReturnValue(false);
    getPlatform.mockReturnValue('ios');
    setAttributes.mockReset();
    setAttributes.mockResolvedValue(undefined);
    configure.mockClear();
    setLogLevel.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    memory.clear();
  });

  it('is a no-op on web', async () => {
    isNativePlatform.mockReturnValue(false);
    await setReferrerAttribute('  fin_s0  ');
    expect(setAttributes).not.toHaveBeenCalled();
  });

  it('writes using an explicit uid without a prior logIn', async () => {
    isNativePlatform.mockReturnValue(true);
    await setReferrerAttribute('  fin_s0  ', 'uid-1');
    expect(setAttributes).toHaveBeenCalledWith({ [RC_REFERRER_ATTRIBUTE_KEY]: 'FIN_S0' });
    expect(readLocallySyncedReferrer('uid-1')).toBe('FIN_S0');
  });

  it('writes the uppercase referrer attribute once on native', async () => {
    isNativePlatform.mockReturnValue(true);
    await logInRevenueCatUser('uid-1');
    await setReferrerAttribute('  fin_s0  ');
    expect(setAttributes).toHaveBeenCalledTimes(1);
    expect(setAttributes).toHaveBeenCalledWith({ [RC_REFERRER_ATTRIBUTE_KEY]: 'FIN_S0' });
    expect(readLocallySyncedReferrer('uid-1')).toBe('FIN_S0');

    await setReferrerAttribute('FIN_S0');
    expect(setAttributes).toHaveBeenCalledTimes(1);
  });

  it('swallows SDK errors without marking local sync', async () => {
    isNativePlatform.mockReturnValue(true);
    await logInRevenueCatUser('uid-1');
    memory.clear();
    setAttributes.mockRejectedValueOnce(new Error('network'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(setReferrerAttribute('FIN_S0')).resolves.toBeUndefined();
    expect(readLocallySyncedReferrer('uid-1')).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
