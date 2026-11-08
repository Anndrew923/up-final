import { describe, expect, it } from 'vitest';
import {
  resolvePushNotificationRoute,
  resolvePushPlatform,
} from '../pushNotificationRoute';

describe('resolvePushNotificationRoute', () => {
  it('accepts Crew absolute paths with optional query', () => {
    expect(resolvePushNotificationRoute({ route: '/crew?focusUid=u1' })).toBe(
      '/crew?focusUid=u1'
    );
    expect(resolvePushNotificationRoute({ path: '/crew' })).toBe('/crew');
  });

  it('rejects external / scheme URLs and non-crew app paths', () => {
    expect(resolvePushNotificationRoute({ route: 'https://evil.example' })).toBeNull();
    expect(resolvePushNotificationRoute({ route: '//evil' })).toBeNull();
    expect(resolvePushNotificationRoute({ route: 'capacitor://app' })).toBeNull();
    expect(resolvePushNotificationRoute({ route: '/home' })).toBeNull();
    expect(resolvePushNotificationRoute({ route: '/crewevil' })).toBeNull();
    expect(resolvePushNotificationRoute({ route: '/crew/extra' })).toBeNull();
    expect(resolvePushNotificationRoute(null)).toBeNull();
  });
});

describe('resolvePushPlatform', () => {
  it('maps capacitor platforms', () => {
    expect(resolvePushPlatform('ios')).toBe('ios');
    expect(resolvePushPlatform('android')).toBe('android');
    expect(resolvePushPlatform('web')).toBe('web');
    expect(resolvePushPlatform('electron')).toBeNull();
  });
});
