/* @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';

const browserOpen = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const isNativePlatform = vi.hoisted(() => vi.fn(() => false));
const getPlatform = vi.hoisted(() => vi.fn(() => 'web'));

vi.mock('@capacitor/browser', () => ({
  Browser: { open: browserOpen },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform, getPlatform },
}));

const {
  openStoreSubscriptionManagement,
  PLAY_SUBSCRIPTION_MANAGE_URL,
  APP_STORE_SUBSCRIPTION_MANAGE_URL,
  resolveStoreSubscriptionManageUrl,
} = await import('../storeSubscriptionManageService');

describe('storeSubscriptionManageService', () => {
  afterEach(() => {
    browserOpen.mockClear();
    isNativePlatform.mockReset();
    getPlatform.mockReset();
    isNativePlatform.mockReturnValue(false);
    getPlatform.mockReturnValue('web');
    vi.unstubAllGlobals();
  });

  it('resolves Play URL on web', () => {
    expect(resolveStoreSubscriptionManageUrl()).toBe(PLAY_SUBSCRIPTION_MANAGE_URL);
  });

  it('resolves App Store URL on native iOS', () => {
    isNativePlatform.mockReturnValue(true);
    getPlatform.mockReturnValue('ios');
    expect(resolveStoreSubscriptionManageUrl()).toBe(APP_STORE_SUBSCRIPTION_MANAGE_URL);
  });

  it('resolves Play URL on native Android', () => {
    isNativePlatform.mockReturnValue(true);
    getPlatform.mockReturnValue('android');
    expect(resolveStoreSubscriptionManageUrl()).toBe(PLAY_SUBSCRIPTION_MANAGE_URL);
  });

  it('opens Play manage URL via window.open on web', async () => {
    const open = vi.fn();
    vi.stubGlobal('open', open);
    isNativePlatform.mockReturnValue(false);

    await openStoreSubscriptionManagement();

    expect(open).toHaveBeenCalledWith(
      PLAY_SUBSCRIPTION_MANAGE_URL,
      '_blank',
      'noopener,noreferrer'
    );
    expect(browserOpen).not.toHaveBeenCalled();
  });

  it('opens App Store manage URL via Capacitor Browser on iOS', async () => {
    isNativePlatform.mockReturnValue(true);
    getPlatform.mockReturnValue('ios');

    await openStoreSubscriptionManagement();

    expect(browserOpen).toHaveBeenCalledWith({ url: APP_STORE_SUBSCRIPTION_MANAGE_URL });
  });

  it('opens Play manage URL via Capacitor Browser on Android', async () => {
    isNativePlatform.mockReturnValue(true);
    getPlatform.mockReturnValue('android');

    await openStoreSubscriptionManagement();

    expect(browserOpen).toHaveBeenCalledWith({ url: PLAY_SUBSCRIPTION_MANAGE_URL });
  });
});
