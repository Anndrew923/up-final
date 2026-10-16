import { describe, expect, it } from 'vitest';
import {
  formatInviteCodeForDisplay,
  generateInviteCode,
  GUILD_INVITE_CODE_ALPHABET,
  GUILD_INVITE_CODE_LENGTH,
  isValidInviteCodeShape,
  normalizeInviteCode,
} from '../guildInviteCode';

describe('normalizeInviteCode', () => {
  it('returns empty for non-strings', () => {
    expect(normalizeInviteCode(null)).toBe('');
    expect(normalizeInviteCode(123)).toBe('');
    expect(normalizeInviteCode(undefined)).toBe('');
  });

  it('uppercases and strips whitespace / hyphens / dots / underscores', () => {
    expect(normalizeInviteCode('  ab-cd_ef.  ')).toBe('ABCDEF');
    expect(normalizeInviteCode('abc def')).toBe('ABCDEF');
  });
});

describe('isValidInviteCodeShape', () => {
  it('accepts exactly 6 alphabet chars', () => {
    expect(isValidInviteCodeShape('ABCDEF')).toBe(true);
    expect(isValidInviteCodeShape('ab-cd-ef')).toBe(true);
    expect(isValidInviteCodeShape('234567')).toBe(true);
  });

  it('rejects wrong length', () => {
    expect(isValidInviteCodeShape('ABCDE')).toBe(false);
    expect(isValidInviteCodeShape('ABCDEFG')).toBe(false);
    expect(isValidInviteCodeShape('')).toBe(false);
  });

  it('rejects look-alike / out-of-alphabet glyphs', () => {
    expect(isValidInviteCodeShape('ABCDE0')).toBe(false);
    expect(isValidInviteCodeShape('ABCDEO')).toBe(false);
    expect(isValidInviteCodeShape('ABCDE1')).toBe(false);
    expect(isValidInviteCodeShape('ABCDEI')).toBe(false);
    expect(isValidInviteCodeShape('ABCDEL')).toBe(false);
    expect(isValidInviteCodeShape('ABCDEF!')).toBe(false);
  });
});

describe('generateInviteCode', () => {
  it('emits length-6 codes from the alphabet', () => {
    const code = generateInviteCode(() => 0);
    expect(code).toHaveLength(GUILD_INVITE_CODE_LENGTH);
    expect(isValidInviteCodeShape(code)).toBe(true);
    expect([...code].every((ch) => GUILD_INVITE_CODE_ALPHABET.includes(ch))).toBe(true);
  });

  it('is deterministic for a fixed RNG sequence', () => {
    let i = 0;
    const seq = [0, 0.5, 0.99, 0.25, 0.75, 0.1];
    const rng = () => seq[i++] ?? 0;
    const a = generateInviteCode(rng);
    i = 0;
    const b = generateInviteCode(rng);
    expect(a).toBe(b);
    expect(a).toHaveLength(6);
  });

  it('never emits excluded look-alike characters across many draws', () => {
    const banned = new Set(['0', 'O', '1', 'I', 'L']);
    for (let n = 0; n < 200; n += 1) {
      const code = generateInviteCode();
      for (const ch of code) {
        expect(banned.has(ch)).toBe(false);
      }
    }
  });
});

describe('formatInviteCodeForDisplay', () => {
  it('inserts a hyphen for valid 6-char codes', () => {
    expect(formatInviteCodeForDisplay('abcdef')).toBe('ABC-DEF');
  });

  it('returns normalized raw when shape is invalid', () => {
    expect(formatInviteCodeForDisplay('ab')).toBe('AB');
  });
});
