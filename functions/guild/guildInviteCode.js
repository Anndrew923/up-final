/**
 * Mirror of `src/logic/core/guildInviteCode.ts` — keep alphabets in lockstep.
 * WHY: Callable TX must validate / mint codes without importing the Vite client bundle.
 */

export const GUILD_INVITE_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const GUILD_INVITE_CODE_LENGTH = 6;

const ALPHABET_SET = new Set(GUILD_INVITE_CODE_ALPHABET.split(""));

export function normalizeInviteCode(raw) {
  if (typeof raw !== "string") return "";
  return raw.trim().toUpperCase().replace(/[\s\-_.]/g, "");
}

export function isValidInviteCodeShape(raw) {
  const code = normalizeInviteCode(raw);
  if (code.length !== GUILD_INVITE_CODE_LENGTH) return false;
  for (const ch of code) {
    if (!ALPHABET_SET.has(ch)) return false;
  }
  return true;
}

/**
 * @param {() => number} [rng]
 */
export function generateInviteCode(rng = Math.random) {
  const alphabet = GUILD_INVITE_CODE_ALPHABET;
  let out = "";
  for (let i = 0; i < GUILD_INVITE_CODE_LENGTH; i += 1) {
    const idx = Math.floor(rng() * alphabet.length) % alphabet.length;
    out += alphabet[idx];
  }
  return out;
}
