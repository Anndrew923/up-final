import { describe, expect, it } from 'vitest';
import {
  joinArenaDescriptionKey,
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
});
