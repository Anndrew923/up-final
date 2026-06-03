/**
 * Expandable baseline profanity gate for arena display names (not full NLP).
 * Mirror list in `functions/ladder/profanity.js` when adding terms.
 */
const PROFANITY_TERMS: readonly string[] = [
  'fuck',
  'shit',
  'bitch',
  'cunt',
  'nigger',
  'faggot',
  '傻逼',
  '操你',
  '去死',
  '殺你',
];

let cachedPattern: RegExp | null = null;

function getProfanityPattern(): RegExp {
  if (!cachedPattern) {
    const escaped = PROFANITY_TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    cachedPattern = new RegExp(escaped.join('|'), 'i');
  }
  return cachedPattern;
}

export type LadderDisplayNameValidationCode = 'empty' | 'profanity';

export type LadderDisplayNameValidationResult =
  | { ok: true; normalized: string }
  | { ok: false; code: LadderDisplayNameValidationCode };

/** Case-insensitive substring match against the baseline deny list. */
export function containsProfanity(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  return getProfanityPattern().test(trimmed);
}

/**
 * Validates trimmed display name before save/upload.
 * Returns a normalized clamped string on success (caller may still run `normalizeLadderDisplayName`).
 */
export function validateLadderDisplayNameForSave(
  raw: string,
  maxLength: number
): LadderDisplayNameValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, code: 'empty' };
  if (containsProfanity(trimmed)) return { ok: false, code: 'profanity' };
  return { ok: true, normalized: trimmed.slice(0, maxLength) };
}
