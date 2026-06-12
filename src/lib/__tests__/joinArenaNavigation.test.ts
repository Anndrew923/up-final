import { describe, expect, it } from 'vitest';
import {
  joinArenaDescriptionKey,
  joinArenaGateFeature,
  joinArenaPath,
  parseJoinArenaFrom,
} from '../joinArenaNavigation';

describe('joinArenaNavigation', () => {
  it('parses known from query values', () => {
    expect(parseJoinArenaFrom('?from=ladder')).toBe('ladder');
    expect(parseJoinArenaFrom('?from=backup')).toBe('backup');
    expect(parseJoinArenaFrom('?from=settings')).toBe('settings');
    expect(parseJoinArenaFrom('?from=unknown')).toBeNull();
  });

  it('builds contextual paths and description keys', () => {
    expect(joinArenaPath('ladder')).toBe('/join-arena?from=ladder');
    expect(joinArenaPath('backup')).toBe('/join-arena?from=backup');
    expect(joinArenaDescriptionKey('ladder')).toBe('joinDescriptionFromLadder');
    expect(joinArenaDescriptionKey('backup')).toBe('joinDescriptionFromBackup');
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
