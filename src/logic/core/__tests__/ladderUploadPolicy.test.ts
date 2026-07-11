import { describe, expect, it } from 'vitest';
import {
  hasLadderIdentityReady,
  ladderIdentityInitial,
} from '../ladderUploadPolicy';

describe('hasLadderIdentityReady', () => {
  it('rejects empty / whitespace names (hard gate)', () => {
    expect(hasLadderIdentityReady(undefined)).toBe(false);
    expect(hasLadderIdentityReady(null)).toBe(false);
    expect(hasLadderIdentityReady('')).toBe(false);
    expect(hasLadderIdentityReady('   ')).toBe(false);
  });

  it('accepts a non-empty display name even without avatar', () => {
    expect(hasLadderIdentityReady('Bruce')).toBe(true);
    expect(hasLadderIdentityReady('  Pilot42  ')).toBe(true);
  });
});

describe('ladderIdentityInitial', () => {
  it('uses the first character for soft avatar fallback', () => {
    expect(ladderIdentityInitial('bruce')).toBe('B');
    expect(ladderIdentityInitial(' 安 ')).toBe('安');
  });

  it('returns ? when name is missing', () => {
    expect(ladderIdentityInitial('')).toBe('?');
    expect(ladderIdentityInitial(null)).toBe('?');
  });
});
