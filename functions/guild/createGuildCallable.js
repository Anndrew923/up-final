/**
 * createGuild — Pro-only crew creation (1 user = 1 crew).
 * Writes: guilds/{id}, guild_invite_codes/{code}, users/{uid} guild fields.
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import {
  CALLABLE_OPTS,
  GUILD_INVITE_CODE_MAX_MINT_ATTEMPTS,
  GUILD_INVITE_CODES_COLLECTION,
  GUILD_MAX_MEMBERS,
  GUILDS_COLLECTION,
} from "../shared/constants.js";
import { db } from "../shared/admin.js";
import { hasProFromUserDoc } from "../shared/userEntitlement.js";
import { requireSignedInUid, rethrowGuildError } from "./guildAuth.js";
import { generateInviteCode } from "./guildInviteCode.js";
import {
  assertCanCreateGuild,
  buildMemberSnapshot,
  buildNewGuildDoc,
  normalizeGuildName,
  normalizeGuildTag,
  sanitizeAvatarUrl,
  sanitizeDisplayName,
} from "./guildCore.js";
import { sanitizeGuildRadarScores } from "./guildRadarScores.js";
import { userGuildBindPatch } from "./guildUserFields.js";

/**
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 */
export async function runCreateGuild(request) {
  const uid = requireSignedInUid(request);

  const data = request.data || {};
  const nameResult = normalizeGuildName(data.name);
  if (!nameResult.ok) {
    throw new HttpsError("invalid-argument", nameResult.reason);
  }
  const tagResult = normalizeGuildTag(data.tag);
  if (!tagResult.ok) {
    throw new HttpsError("invalid-argument", tagResult.reason);
  }

  const displayName = sanitizeDisplayName(data.displayName, uid);
  const avatarUrl = sanitizeAvatarUrl(data.avatarUrl);
  const seedScore = Number(data.ladderScore);
  const ladderScore = Number.isFinite(seedScore) ? Math.max(0, seedScore) : 0;
  const radarScores = sanitizeGuildRadarScores(data.radarScores);
  const userRef = db.collection("users").doc(uid);

  for (let attempt = 0; attempt < GUILD_INVITE_CODE_MAX_MINT_ATTEMPTS; attempt += 1) {
    const inviteCode = generateInviteCode();
    const inviteRef = db.collection(GUILD_INVITE_CODES_COLLECTION).doc(inviteCode);
    const guildRef = db.collection(GUILDS_COLLECTION).doc();

    try {
      const result = await db.runTransaction(async (tx) => {
        const [userSnap, inviteSnap] = await Promise.all([
          tx.get(userRef),
          tx.get(inviteRef),
        ]);

        if (inviteSnap.exists) {
          const err = new Error("invite-code-collision");
          err.code = "invite-code-collision";
          throw err;
        }

        const userData = userSnap.exists ? userSnap.data() : null;
        const isPro = hasProFromUserDoc(userData);
        const gate = assertCanCreateGuild(userData, isPro);
        if (!gate.ok) {
          if (gate.reason === "pro-required") {
            throw new HttpsError("permission-denied", "pro-required");
          }
          throw new HttpsError("failed-precondition", gate.reason);
        }

        const nowIso = new Date().toISOString();
        const coachSnapshot = buildMemberSnapshot({
          uid,
          displayName,
          avatarUrl,
          ladderScore,
          radarScores,
          updatedAt: nowIso,
        });
        const guildId = guildRef.id;
        const guildDoc = buildNewGuildDoc({
          guildId,
          name: nameResult.name,
          tag: tagResult.tag,
          coachUid: uid,
          inviteCode,
          coachSnapshot,
          nowIso,
          maxMembers: GUILD_MAX_MEMBERS,
        });

        tx.set(guildRef, guildDoc);
        tx.set(inviteRef, {
          guildId,
          coachUid: uid,
          createdAt: nowIso,
        });
        tx.set(
          userRef,
          userGuildBindPatch({ guildId, guildRole: "coach", nowIso }),
          { merge: true }
        );

        return {
          guildId,
          inviteCode,
          name: nameResult.name,
          tag: tagResult.tag,
        };
      });

      return { ok: true, ...result };
    } catch (err) {
      if (err?.code === "invite-code-collision") {
        continue;
      }
      rethrowGuildError(err, "[createGuild] unexpected", "create-guild-failed");
    }
  }

  throw new HttpsError("resource-exhausted", "invite-code-mint-exhausted");
}

export const createGuild = onCall(CALLABLE_OPTS, async (request) => {
  return runCreateGuild(request);
});
