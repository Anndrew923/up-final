/**
 * leaveGuild — members only; coaches must disbandGuild.
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { CALLABLE_OPTS, GUILDS_COLLECTION } from "../shared/constants.js";
import { db } from "../shared/admin.js";
import { requireSignedInUid, rethrowGuildError } from "./guildAuth.js";
import {
  assertCanLeaveGuild,
  readUserGuildId,
  removeGuildMember,
} from "./guildCore.js";
import { userGuildClearPatch } from "./guildUserFields.js";

/**
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 */
export async function runLeaveGuild(request) {
  const uid = requireSignedInUid(request);
  const userRef = db.collection("users").doc(uid);

  try {
    await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      const userData = userSnap.exists ? userSnap.data() : null;
      const gate = assertCanLeaveGuild(userData);
      if (!gate.ok) {
        throw new HttpsError("failed-precondition", gate.reason);
      }

      const guildId = gate.guildId || readUserGuildId(userData);
      const guildRef = db.collection(GUILDS_COLLECTION).doc(guildId);
      const guildSnap = await tx.get(guildRef);
      const nowIso = new Date().toISOString();

      if (!guildSnap.exists) {
        // Orphan binding — clear user fields so they can rejoin elsewhere.
        tx.set(userRef, userGuildClearPatch(nowIso), { merge: true });
        return;
      }

      const guildData = guildSnap.data() || {};
      // Defense: coachUid on guild wins over stale role field.
      if (guildData.coachUid === uid) {
        throw new HttpsError("failed-precondition", "coach-cannot-leave");
      }

      const removed = removeGuildMember(guildData, uid);
      if (!removed.ok) {
        // Stale user.guildId but not in members[] — heal the user doc.
        tx.set(userRef, userGuildClearPatch(nowIso), { merge: true });
        return;
      }

      tx.update(guildRef, {
        memberUids: removed.next.memberUids,
        members: removed.next.members,
        memberCount: removed.next.memberCount,
        updatedAt: nowIso,
      });
      tx.set(userRef, userGuildClearPatch(nowIso), { merge: true });
    });

    return { ok: true };
  } catch (err) {
    rethrowGuildError(err, "[leaveGuild] unexpected", "leave-guild-failed");
  }
}

export const leaveGuild = onCall(CALLABLE_OPTS, async (request) => {
  return runLeaveGuild(request);
});
