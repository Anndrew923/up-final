/**
 * Expandable baseline profanity gate — keep in sync with `src/logic/core/ladderDisplayNamePolicy.ts`.
 */
const PROFANITY_TERMS = [
  "fuck",
  "shit",
  "bitch",
  "cunt",
  "nigger",
  "faggot",
  "傻逼",
  "操你",
  "去死",
  "殺你",
];

let cachedPattern = null;

function getProfanityPattern() {
  if (!cachedPattern) {
    const escaped = PROFANITY_TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    cachedPattern = new RegExp(escaped.join("|"), "i");
  }
  return cachedPattern;
}

export function containsProfanity(raw) {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) return false;
  return getProfanityPattern().test(trimmed);
}
