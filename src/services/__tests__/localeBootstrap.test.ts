import { beforeEach, describe, expect, it, vi } from 'vitest';

const isNativePlatform = vi.fn(() => false);
const getLanguageCode = vi.fn(async () => ({ value: 'zh-TW' }));
const hasUserLocaleOverride = vi.fn(() => false);
const changeLanguage = vi.fn(async () => undefined);

vi.mock('@capacitor/device', () => ({
  Device: { getLanguageCode },
}));

vi.mock('../../lib/capacitorPlatform', () => ({
  isCapacitorNativePlatform: () => isNativePlatform(),
}));

vi.mock('../../i18n/language', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../i18n/language')>();
  return {
    ...actual,
    hasUserLocaleOverride: () => hasUserLocaleOverride(),
  };
});

vi.mock('../../i18n', () => ({
  default: {
    isInitialized: true,
    language: 'en',
    resolvedLanguage: 'en',
    on: vi.fn(),
    changeLanguage,
  },
}));

describe('bootstrapLocaleFromNativeDevice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isNativePlatform.mockReturnValue(false);
    hasUserLocaleOverride.mockReturnValue(false);
  });

  it('no-ops on web', async () => {
    const { bootstrapLocaleFromNativeDevice } = await import('../localeBootstrap');
    await bootstrapLocaleFromNativeDevice();
    expect(getLanguageCode).not.toHaveBeenCalled();
  });

  it('aligns zh device language on native when user has not overridden', async () => {
    isNativePlatform.mockReturnValue(true);
    getLanguageCode.mockResolvedValue({ value: 'zh-TW' });

    const { bootstrapLocaleFromNativeDevice } = await import('../localeBootstrap');
    await bootstrapLocaleFromNativeDevice();

    expect(getLanguageCode).toHaveBeenCalled();
    expect(changeLanguage).toHaveBeenCalledWith('zh-Hant');
  });

  it('skips when user manually chose locale', async () => {
    isNativePlatform.mockReturnValue(true);
    hasUserLocaleOverride.mockReturnValue(true);

    const { bootstrapLocaleFromNativeDevice } = await import('../localeBootstrap');
    await bootstrapLocaleFromNativeDevice();

    expect(getLanguageCode).not.toHaveBeenCalled();
  });
});
