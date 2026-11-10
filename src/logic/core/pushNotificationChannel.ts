/**
 * Android NotificationChannel contract for Club Progress Dispatch.
 * WHY: Android 8+ drops heads-up banners unless the app creates a HIGH-importance
 * channel whose id matches FCM `android.notification.channelId` + Manifest meta-data.
 *
 * Native `MainActivity` creates this channel first (importance freeze). JS
 * `createChannel` is a belt-and-suspenders refresh for name/vibration.
 *
 * Sound is intentionally omitted: Capacitor maps `sound` to `res/raw/{name}`;
 * passing `"default"` would resolve a missing raw resource. System default sound
 * comes from the channel + FCM `defaultSound: true`.
 */

/** Keep in sync with `functions/shared/constants.js` → CLUB_DISPATCH_ANDROID_CHANNEL_ID. */
export const CLUB_DISPATCH_ANDROID_CHANNEL_ID = 'club_dispatches';

/**
 * System Settings channel label — not in-app UI chrome, but still locale-aware.
 * WHY: Avoid hardcoding zh-only labels on English devices after JS recreateChannel.
 */
export function resolveClubDispatchAndroidChannelName(
  languageTag: string =
    typeof navigator !== 'undefined' && typeof navigator.language === 'string'
      ? navigator.language
      : 'en'
): string {
  return languageTag.toLowerCase().startsWith('zh')
    ? '戰隊戰報通知'
    : 'Club Dispatch Alerts';
}

export function buildClubDispatchAndroidChannel(languageTag?: string): {
  id: typeof CLUB_DISPATCH_ANDROID_CHANNEL_ID;
  name: string;
  importance: 5;
  vibration: true;
} {
  return {
    id: CLUB_DISPATCH_ANDROID_CHANNEL_ID,
    name: resolveClubDispatchAndroidChannelName(languageTag),
    // IMPORTANCE_HIGH (5) — enables floating heads-up banners.
    importance: 5,
    vibration: true,
  };
}

/** Default zh-Hant channel shape — tests / call sites that do not need runtime locale. */
export const CLUB_DISPATCH_ANDROID_CHANNEL = buildClubDispatchAndroidChannel('zh-Hant');
