/**
 * Guild invite codes — Base32 subset excluding look-alike glyphs.
 * WHY: Spoken / handwritten codes (coach → student) must not confuse 0/O/1/I/L.
 * Storage form is always 6 uppercase chars; display may insert a hyphen.
 */

/** Crockford-like alphabet without 0, O, 1, I, L. */
export const GUILD_INVITE_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' as const;

export const GUILD_INVITE_CODE_LENGTH = 6;

const ALPHABET_SET = new Set(GUILD_INVITE_CODE_ALPHABET.split(''));

export type GuildInviteCodeRng = () => number;

function defaultRng(): number {
  return Math.random();
}

/**
 * Strip separators / whitespace and uppercase for lookup / storage.
 */
export function normalizeInviteCode(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().toUpperCase().replace(/[\s\-_.]/g, '');
}

/**
 * True when normalized form is exactly 6 chars from the invite alphabet.
 */
export function isValidInviteCodeShape(raw: unknown): boolean {
  const code = normalizeInviteCode(raw);
  if (code.length !== GUILD_INVITE_CODE_LENGTH) return false;
  for (const ch of code) {
    if (!ALPHABET_SET.has(ch)) return false;
  }
  return true;
}

/**
 * Cryptographically optional: callers may inject a seeded RNG for tests.
 * Uniqueness is enforced by Firestore TX on `guild_invite_codes/{code}`, not by entropy alone.
 */
export function generateInviteCode(rng: GuildInviteCodeRng = defaultRng): string {
  const alphabet = GUILD_INVITE_CODE_ALPHABET;
  let out = '';
  for (let i = 0; i < GUILD_INVITE_CODE_LENGTH; i += 1) {
    const idx = Math.floor(rng() * alphabet.length) % alphabet.length;
    out += alphabet[idx];
  }
  return out;
}

/** Optional display form: `ABC-DEF` when length is 6. */
export function formatInviteCodeForDisplay(raw: unknown): string {
  const code = normalizeInviteCode(raw);
  if (code.length !== GUILD_INVITE_CODE_LENGTH) return code;
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}
