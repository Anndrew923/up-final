/**
 * `users/{uid}` guild field patches — Admin SDK only.
 * WHY: leave / kick / disband / create / join must mutate the same three keys.
 */
import { FieldValue } from "../shared/admin.js";

/**
 * @param {string} nowIso
 */
export function userGuildClearPatch(nowIso) {
  return {
    guildId: FieldValue.delete(),
    guildRole: FieldValue.delete(),
    guildJoinedAt: FieldValue.delete(),
    updatedAt: nowIso,
  };
}

/**
 * @param {{ guildId: string; guildRole: 'coach' | 'member'; nowIso: string }} input
 */
export function userGuildBindPatch({ guildId, guildRole, nowIso }) {
  return {
    guildId,
    guildRole,
    guildJoinedAt: nowIso,
    updatedAt: nowIso,
  };
}
