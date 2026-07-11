import { describe, expect, it } from 'vitest';
import { ROUTES } from '../../config/routes';
import {
  isAllowedJoinArenaReturnTo,
  joinArenaDescriptionKey,
  joinArenaGateFeature,
  joinArenaPath,
  parseJoinArenaFrom,
  parseJoinArenaReturnTo,
  resolveJoinArenaReturnTo,
} from '../joinArenaNavigation';

describe('joinArenaNavigation', () => {
  it('parses known from query values', () => {
    expect(parseJoinArenaFrom('?from=ladder')).toBe('ladder');
    expect(parseJoinArenaFrom('?from=backup')).toBe('backup');
    expect(parseJoinArenaFrom('?from=settings')).toBe('settings');
    expect(parseJoinArenaFrom('?from=dyno-intel')).toBe('dyno-intel');
    expect(parseJoinArenaFrom('?from=unknown')).toBeNull();
  });

  it('builds contextual paths with optional allowlisted returnTo', () => {
    expect(joinArenaPath('ladder')).toBe('/join-arena?from=ladder');
    expect(joinArenaPath('backup')).toBe('/join-arena?from=backup');
    const dynoUrl = joinArenaPath('dyno-intel', ROUTES.home);
    expect(dynoUrl.startsWith('/join-arena?')).toBe(true);
    const qs = `?${dynoUrl.split('?')[1]}`;
    expect(parseJoinArenaFrom(qs)).toBe('dyno-intel');
    expect(parseJoinArenaReturnTo(qs)).toBe(ROUTES.home);
  });

  it('rejects open-redirect returnTo values', () => {
    expect(isAllowedJoinArenaReturnTo('https://evil.example')).toBe(false);
    expect(parseJoinArenaReturnTo('?returnTo=https://evil.example')).toBeNull();
    expect(parseJoinArenaReturnTo('?returnTo=/not-a-real-route')).toBeNull();
    expect(joinArenaPath('dyno-intel', 'https://evil.example')).toBe(
      '/join-arena?from=dyno-intel'
    );
  });

  it('resolves returnTo with funnel defaults', () => {
    expect(resolveJoinArenaReturnTo('backup', '')).toBe(ROUTES.tools);
    expect(resolveJoinArenaReturnTo('dyno-intel', '')).toBe(ROUTES.home);
    expect(resolveJoinArenaReturnTo('ladder', '')).toBe(ROUTES.ladder);
    expect(
      resolveJoinArenaReturnTo('dyno-intel', `?returnTo=${encodeURIComponent(ROUTES.grip)}`)
    ).toBe(ROUTES.grip);
  });

  it('builds contextual description keys', () => {
    expect(joinArenaDescriptionKey('ladder')).toBe('joinDescriptionFromLadder');
    expect(joinArenaDescriptionKey('backup')).toBe('joinDescriptionFromBackup');
    expect(joinArenaDescriptionKey('dyno-intel')).toBe('joinDescriptionFromDynoIntel');
    expect(joinArenaDescriptionKey('settings')).toBe('joinDescription');
    expect(joinArenaDescriptionKey(null)).toBe('joinDescription');
  });

  it('maps entry context to UI gate feature keys', () => {
    expect(joinArenaGateFeature('backup')).toBe('cloud-sync');
    expect(joinArenaGateFeature('dyno-intel')).toBe('dyno-intel-full');
    expect(joinArenaGateFeature('ladder')).toBe('ladder-read');
    expect(joinArenaGateFeature('settings')).toBe('ladder-read');
    expect(joinArenaGateFeature(null)).toBe('ladder-read');
  });
});
