import type { CustomDetector } from 'i18next-browser-languagedetector';
import { hasUserLocaleOverride, I18N_STORAGE_KEY, toSupportedLng } from './language';

/**
 * WHY: Settings manual pick must survive cold start even when detection.order prefers navigator.
 */
export const userOverrideDetector: CustomDetector = {
  name: 'userOverride',
  lookup() {
    if (typeof window === 'undefined' || !hasUserLocaleOverride()) return undefined;
    try {
      const raw = window.localStorage.getItem(I18N_STORAGE_KEY);
      return raw ? toSupportedLng(raw) : undefined;
    } catch {
      return undefined;
    }
  },
};
