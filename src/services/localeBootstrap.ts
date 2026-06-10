import { Device } from '@capacitor/device';
import i18n from '../i18n';
import { bootstrapDocumentLocaleFromStorage } from '../i18n/bootstrapDocumentLocale';
import { hasUserLocaleOverride, toSupportedLng } from '../i18n/language';
import { isCapacitorNativePlatform } from '../lib/capacitorPlatform';

function waitForI18nInit(): Promise<void> {
  if (i18n.isInitialized) return Promise.resolve();
  return new Promise((resolve) => {
    const onReady = () => {
      i18n.off('initialized', onReady);
      resolve();
    };
    i18n.on('initialized', onReady);
  });
}

/**
 * WHY: Capacitor WebView `navigator.language` often drifts to en on zh-TW devices.
 * Native `Device.getLanguageCode()` is the hardware truth — align i18n when user has not overridden.
 */
/** Single startup entry: early document surfaces, then native hardware locale on Capacitor. */
export async function bootstrapLocaleOnStartup(): Promise<void> {
  bootstrapDocumentLocaleFromStorage();
  await bootstrapLocaleFromNativeDevice();
}

export async function bootstrapLocaleFromNativeDevice(): Promise<void> {
  if (!isCapacitorNativePlatform() || hasUserLocaleOverride()) return;

  await waitForI18nInit();

  try {
    const { value } = await Device.getLanguageCode();
    const deviceLng = toSupportedLng(value);
    const current = toSupportedLng(i18n.resolvedLanguage ?? i18n.language);
    if (deviceLng !== current) {
      await i18n.changeLanguage(deviceLng);
    }
  } catch {
    /* Device plugin unavailable — rely on navigator detection */
  }
}
