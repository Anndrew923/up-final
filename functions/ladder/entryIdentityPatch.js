import { sanitizeAvatarUrl } from "./validate.js";

/**
 * Score-equal path: detect denormalized entry fields that still need a merge write.
 * WHY: Each shard stores its own displayName/avatar/isPro snapshot; rename and Pro
 * honor refresh must fan out even when scoreBest is unchanged (B1 — no entitlement fan-out).
 *
 * @param {Record<string, unknown> | undefined | null} stored
 * @param {{ displayName: string, profile?: { isAnonymousInLadder?: boolean } | null, avatarUrl?: string | null, isPro?: boolean }} next
 */
export function resolveScoreEqualEntryPatch(stored, next) {
  const isAnonymous = next?.profile?.isAnonymousInLadder === true;
  const nextName = isAnonymous ? "Anonymous" : String(next?.displayName ?? "");
  const storedName = String(stored?.displayName ?? "");
  const storedAnon = stored?.isAnonymousInLadder === true;
  const storedAvatar = sanitizeAvatarUrl(stored?.avatarUrl);
  const nextAvatar = sanitizeAvatarUrl(next?.avatarUrl);
  const nextPro = next?.isPro === true;
  const storedPro = stored?.isPro === true;

  const nameChanged = storedName !== nextName;
  const anonChanged = storedAnon !== isAnonymous;
  const avatarChanged = Boolean(
    (nextAvatar && nextAvatar !== storedAvatar) || (isAnonymous && storedAvatar)
  );
  const isProChanged = nextPro !== storedPro;

  return {
    needsPatch: nameChanged || anonChanged || avatarChanged || isProChanged,
    identityChanged: nameChanged || anonChanged,
    avatarChanged,
  };
}
