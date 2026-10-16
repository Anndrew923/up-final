/**
 * renameGuild — coach-only name/tag update.
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { CALLABLE_OPTS, GUILDS_COLLECTION } from "../shared/constants.js";
import { db } from "../shared/admin.js";
import { requireSignedInUid, rethrowGuildError } from "./guildAuth.js";
import {
  assertIsGuildCoach,
  normalizeGuildName,
  normalizeGuildTag,
  readUserGuildId,
} from "./guildCore.js";

/**
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 */
export async function runRenameGuild(request) {
  const uid = requireSignedInUid(request);

  const data = request.data || {};
  const hasName = Object.prototype.hasOwnProperty.call(data, "name");
  const hasTag = Object.prototype.hasOwnProperty.call(data, "tag");
  if (!hasName && !hasTag) {
    throw new HttpsError("invalid-argument", "invalid-name");
  }

  let nextName = null;
  let nextTag = null;
  if (hasName) {
    const nameResult = normalizeGuildName(data.name);
    if (!nameResult.ok) {
      throw new HttpsError("invalid-argument", nameResult.reason);
    }
    nextName = nameResult.name;
  }
  if (hasTag) {
    const tagResult = normalizeGuildTag(data.tag);
    if (!tagResult.ok) {
      throw new HttpsError("invalid-argument", tagResult.reason);
    }
    nextTag = tagResult.tag;
  }

  const userRef = db.collection("users").doc(uid);

  try {
    return await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      const userData = userSnap.exists ? userSnap.data() : null;
      const guildId = readUserGuildId(userData);
      if (!guildId) {
        throw new HttpsError("failed-precondition", "not-in-guild");
      }

      const guildRef = db.collection(GUILDS_COLLECTION).doc(guildId);
      const guildSnap = await tx.get(guildRef);
      if (!guildSnap.exists) {
        throw new HttpsError("not-found", "not-found");
      }
      const guildData = guildSnap.data() || {};
      const coachGate = assertIsGuildCoach(guildData, uid);
      if (!coachGate.ok) {
        throw new HttpsError("permission-denied", coachGate.reason);
      }

      const name =
        nextName ?? (typeof guildData.name === "string" ? guildData.name : "");
      const tag =
        nextTag ?? (typeof guildData.tag === "string" ? guildData.tag : "");
      const nowIso = new Date().toISOString();
      const patch = { updatedAt: nowIso };
      if (nextName != null) patch.name = nextName;
      if (nextTag != null) patch.tag = nextTag;
      tx.update(guildRef, patch);

      return { ok: true, name, tag };
    });
  } catch (err) {
    rethrowGuildError(err, "[renameGuild] unexpected", "rename-guild-failed");
  }
}

export const renameGuild = onCall(CALLABLE_OPTS, async (request) => {
  return runRenameGuild(request);
});
