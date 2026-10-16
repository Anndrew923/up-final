/**
 * disbandGuild — coach-only; clears all member user bindings + invite lookup.
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import {
  CALLABLE_OPTS,
  GUILD_INVITE_CODES_COLLECTION,
  GUILDS_COLLECTION,
} from "../shared/constants.js";
import { db } from "../shared/admin.js";
import { requireSignedInUid, rethrowGuildError } from "./guildAuth.js";
import {
  assertIsGuildCoach,
  readUserGuildId,
  resolveMemberCount,
} from "./guildCore.js";
import { normalizeInviteCode } from "./guildInviteCode.js";
import { userGuildClearPatch } from "./guildUserFields.js";

/**
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 */
export async function runDisbandGuild(request) {
  const uid = requireSignedInUid(request);
  const userRef = db.collection("users").doc(uid);

  try {
    await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      const userData = userSnap.exists ? userSnap.data() : null;
      const guildId = readUserGuildId(userData);
      if (!guildId) {
        throw new HttpsError("failed-precondition", "not-in-guild");
      }

      const guildRef = db.collection(GUILDS_COLLECTION).doc(guildId);
      const guildSnap = await tx.get(guildRef);
      const nowIso = new Date().toISOString();
      const clearPatch = userGuildClearPatch(nowIso);

      if (!guildSnap.exists) {
        tx.set(userRef, clearPatch, { merge: true });
        return;
      }

      const guildData = guildSnap.data() || {};
      const coachGate = assertIsGuildCoach(guildData, uid);
      if (!coachGate.ok) {
        throw new HttpsError("permission-denied", coachGate.reason);
      }

      const { memberUids } = resolveMemberCount(guildData);

      // Read every member user doc before writes (TX contract + guildId race guard).
      const memberRefs = memberUids.map((memberUid) =>
        db.collection("users").doc(memberUid)
      );
      const memberSnaps = await Promise.all(memberRefs.map((ref) => tx.get(ref)));

      for (let i = 0; i < memberUids.length; i += 1) {
        const memberUid = memberUids[i];
        const snap = memberSnaps[i];
        const memberGuildId = readUserGuildId(snap.exists ? snap.data() : null);
        // Only clear if still bound to this guild (may have left concurrently).
        if (memberGuildId === guildId) {
          tx.set(memberRefs[i], clearPatch, { merge: true });
        }
      }
      if (!memberUids.includes(uid)) {
        tx.set(userRef, clearPatch, { merge: true });
      }

      const inviteCode = normalizeInviteCode(guildData.inviteCode);
      if (inviteCode) {
        const inviteRef = db.collection(GUILD_INVITE_CODES_COLLECTION).doc(inviteCode);
        // Read before delete so TX sees the doc (consistent snapshot).
        await tx.get(inviteRef);
        tx.delete(inviteRef);
      }

      tx.set(
        guildRef,
        {
          status: "disbanded",
          memberUids: [],
          members: [],
          memberCount: 0,
          updatedAt: nowIso,
          disbandedAt: nowIso,
        },
        { merge: true }
      );
    });

    return { ok: true };
  } catch (err) {
    rethrowGuildError(err, "[disbandGuild] unexpected", "disband-guild-failed");
  }
}

export const disbandGuild = onCall(CALLABLE_OPTS, async (request) => {
  return runDisbandGuild(request);
});
