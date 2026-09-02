import { ladderIdentityInitial } from './ladderUploadPolicy';

const DEFAULT_FALLBACK_NAME = '未命名用戶';
const MAX_DISPLAY_NAME_LENGTH = 20;
const APPLE_PRIVATE_RELAY_EMAIL_SUFFIX = '@privaterelay.appleid.com';

/** Friendly label when Apple Hide My Email yields a privaterelay address without a real display name. */
export const APPLE_PRIVATE_RELAY_DISPLAY_NAME = '玩家';

/** Avatar initial when relay identity has no user-chosen ladder name (Player / 玩家). */
const APPLE_PRIVATE_RELAY_IDENTITY_INITIAL = 'P';

export interface ResolveDisplayNameInput {
  firebaseDisplayName?: string | null;
  email?: string | null;
  localDisplayName?: string | null;
}

function clampDisplayName(name: string): string {
  const normalized = name.trim();
  if (!normalized) return '';
  return normalized.slice(0, MAX_DISPLAY_NAME_LENGTH);
}

function relayEmailLocalPart(email: string): string {
  return email.split('@')[0]?.trim().toLowerCase() ?? '';
}

export function isApplePrivateRelayEmail(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase();
  return Boolean(normalized?.endsWith(APPLE_PRIVATE_RELAY_EMAIL_SUFFIX));
}

export function isRelayDerivedDisplayName(
  name: string,
  email: string | null | undefined
): boolean {
  if (!email || !isApplePrivateRelayEmail(email)) return false;
  const local = relayEmailLocalPart(email);
  const normalized = name.trim().toLowerCase();
  return !normalized || normalized === local;
}

function shouldUsePrivateRelayFriendlyIdentity(
  displayName: string,
  email: string | null | undefined
): boolean {
  if (!isApplePrivateRelayEmail(email)) return false;
  const trimmed = displayName.trim();
  return trimmed === APPLE_PRIVATE_RELAY_DISPLAY_NAME || isRelayDerivedDisplayName(trimmed, email);
}

function deriveNameFromEmail(email: string | null | undefined): string {
  if (!email || isApplePrivateRelayEmail(email)) return '';
  const [localPart] = email.split('@');
  return localPart?.trim() ?? '';
}

/**
 * Shared display-name strategy across auth, leaderboard and HUD:
 * 1) Local ladder / shell profile name (user-chosen arena identity)
 * 2) Firebase profile name (skipped when it matches a Private Relay local-part)
 * 3) Apple Private Relay friendly label ("玩家")
 * 4) Email local-part (non-relay only)
 * 5) Default fallback
 */
export function resolveDisplayName(input: ResolveDisplayNameInput): string {
  const nameFromLocal = clampDisplayName(input.localDisplayName ?? '');
  if (nameFromLocal) return nameFromLocal;

  const nameFromFirebase = clampDisplayName(input.firebaseDisplayName ?? '');
  if (nameFromFirebase && !isRelayDerivedDisplayName(nameFromFirebase, input.email)) {
    return nameFromFirebase;
  }

  if (isApplePrivateRelayEmail(input.email)) {
    return APPLE_PRIVATE_RELAY_DISPLAY_NAME;
  }

  const nameFromEmail = clampDisplayName(deriveNameFromEmail(input.email));
  if (nameFromEmail) return nameFromEmail;

  return DEFAULT_FALLBACK_NAME;
}

/**
 * Avatar initial for signed-in identity rows — Private Relay "玩家" uses "P" instead of a CJK grapheme.
 */
export function resolveIdentityInitial(
  displayName: string | null | undefined,
  email?: string | null
): string {
  const trimmed = displayName?.trim() ?? '';
  if (shouldUsePrivateRelayFriendlyIdentity(trimmed, email)) {
    return APPLE_PRIVATE_RELAY_IDENTITY_INITIAL;
  }
  return ladderIdentityInitial(displayName);
}

export function getDisplayNameMaxLength(): number {
  return MAX_DISPLAY_NAME_LENGTH;
}
