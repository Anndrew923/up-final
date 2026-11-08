/**
 * Push notification deep-link route helpers (pure).
 * WHY: Keep Capacitor action payloads unit-testable without native plugins.
 */
import { ROUTES } from '../../config/routes';

/**
 * Extract an in-app Crew deep link from push `data.route` (or alias keys).
 * Only allows `/crew` (+ optional query). Rejects http(s), schemes, and other app paths.
 */
export function resolvePushNotificationRoute(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  const raw = record.route ?? record.path ?? record.url;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  // Absolute in-app path only — blocks http(s), schemes, and protocol-relative URLs.
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;

  const queryIndex = trimmed.indexOf('?');
  const pathname = queryIndex >= 0 ? trimmed.slice(0, queryIndex) : trimmed;
  // WHY: Phase 1 club dispatch only deep-links to Crew HQ (SSOT §7).
  if (pathname !== ROUTES.crew) return null;
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
