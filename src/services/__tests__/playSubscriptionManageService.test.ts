/* @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';

const browserOpen = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const isNativePlatform = vi.hoisted(() => vi.fn(() => false));

vi.mock('@capacitor/browser', () => ({
  Browser: { open: browserOpen },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform },
}));

const { openPlaySubscriptionManagement, PLAY_SUBSCRIPTION_MANAGE_URL } =
  await import('../playSubscriptionManageService');

describe('playSubscriptionManageService', () => {
  afterEach(() => {
    browserOpen.mockClear();
    isNativePlatform.mockReset();
    isNativePlatform.mockReturnValue(false);
    vi.unstubAllGlobals();
  });

  it('opens Play manage URL via window.open on web', async () => {
    const open = vi.fn();
    vi.stubGlobal('open', open);
    isNativePlatform.mockReturnValue(false);

    await openPlaySubscriptionManagement();

    expect(open).toHaveBeenCalledWith(
      PLAY_SUBSCRIPTION_MANAGE_URL,
      '_blank',
      'noopener,noreferrer'
    );
    expect(browserOpen).not.toHaveBeenCalled();
  });

  it('opens Play manage URL via Capacitor Browser on native', async () => {
    isNativePlatform.mockReturnValue(true);

    await openPlaySubscriptionManagement();

    expect(browserOpen).toHaveBeenCalledWith({ url: PLAY_SUBSCRIPTION_MANAGE_URL });
  });
});
