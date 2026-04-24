const DEFAULT_FALLBACK_NAME = '未命名用戶';
const MAX_DISPLAY_NAME_LENGTH = 20;

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

function deriveNameFromEmail(email: string | null | undefined): string {
  if (!email) return '';
  const [localPart] = email.split('@');
  return localPart?.trim() ?? '';
}

/**
 * Shared display-name strategy across auth, leaderboard and HUD:
 * 1) Firebase Google profile name
 * 2) Email local-part
 * 3) Local profile name
 * 4) Default fallback
 */
export function resolveDisplayName(input: ResolveDisplayNameInput): string {
  const nameFromGoogle = clampDisplayName(input.firebaseDisplayName ?? '');
  if (nameFromGoogle) return nameFromGoogle;

  const nameFromEmail = clampDisplayName(deriveNameFromEmail(input.email));
  if (nameFromEmail) return nameFromEmail;

  const nameFromLocal = clampDisplayName(input.localDisplayName ?? '');
  if (nameFromLocal) return nameFromLocal;

  return DEFAULT_FALLBACK_NAME;
}

export function getDisplayNameMaxLength(): number {
  return MAX_DISPLAY_NAME_LENGTH;
}
