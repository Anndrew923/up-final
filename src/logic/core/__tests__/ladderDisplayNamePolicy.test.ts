import { describe, expect, it } from 'vitest';
import {
  containsProfanity,
  validateLadderDisplayNameForSave,
} from '../ladderDisplayNamePolicy';

describe('ladderDisplayNamePolicy', () => {
  it('detects baseline profanity terms', () => {
    expect(containsProfanity('hello fuck world')).toBe(true);
    expect(containsProfanity('正常暱稱')).toBe(false);
  });

  it('rejects empty and profane names on save validation', () => {
    expect(validateLadderDisplayNameForSave('   ', 20)).toEqual({ ok: false, code: 'empty' });
    expect(validateLadderDisplayNameForSave('shitlord', 20)).toEqual({
      ok: false,
      code: 'profanity',
    });
    expect(validateLadderDisplayNameForSave('  Pilot42  ', 20)).toEqual({
      ok: true,
      normalized: 'Pilot42',
    });
  });
});
