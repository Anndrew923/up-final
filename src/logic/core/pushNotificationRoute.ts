/**
 * Push notification deep-link route helpers (pure).
 * WHY: Keep Capacitor action payloads unit-testable without native plugins.
 */

/**
 * Extract an in-app path from push `data.route` (or alias keys).
 * Only allows absolute app paths starting with `/` — rejects http(s) / schemes.
 */
export function resolvePushNotificationRoute(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  const raw = record.route ?? record.path ?? record.url;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/')) return null;
  if (trimmed.startsWith('//')) return null;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return null;
  return trimmed;
}

export function resolvePushPlatform(
  capacitorPlatform: string
): 'ios' | 'android' | 'web' | null {
  if (capacitorPlatform === 'ios') return 'ios';
  if (capacitorPlatform === 'android') return 'android';
  if (capacitorPlatform === 'web') return 'web';
  return null;
}
