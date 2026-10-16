/**
 * kickGuildMember — coach-only; cannot kick self.
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { CALLABLE_OPTS, GUILDS_COLLECTION } from "../shared/constants.js";
import { db } from "../shared/admin.js";
import { requireSignedInUid, rethrowGuildError } from "./guildAuth.js";
import {
  assertCanKickMember,
  assertIsGuildCoach,
  readUserGuildId,
  removeGuildMember,
} from "./guildCore.js";
import { userGuildClearPatch } from "./guildUserFields.js";

/**
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 */
export async function runKickGuildMember(request) {
  const uid = requireSignedInUid(request);

  const targetUid =
    typeof request.data?.targetUid === "string" ? request.data.targetUid.trim() : "";
  const kickGate = assertCanKickMember(uid, targetUid);
  if (!kickGate.ok) {
    throw new HttpsError(
      kickGate.reason === "cannot-kick-self" ? "invalid-argument" : "not-found",
      kickGate.reason
    );
  }

  const coachUserRef = db.collection("users").doc(uid);
  const targetUserRef = db.collection("users").doc(targetUid);

  try {
    await db.runTransaction(async (tx) => {
      // All reads before writes (Firestore TX contract).
      const [coachSnap, targetSnap] = await Promise.all([
        tx.get(coachUserRef),
        tx.get(targetUserRef),
      ]);
      const coachData = coachSnap.exists ? coachSnap.data() : null;
      const guildId = readUserGuildId(coachData);
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

      const removed = removeGuildMember(guildData, targetUid);
      if (!removed.ok) {
        throw new HttpsError("failed-precondition", removed.reason);
      }

      const nowIso = new Date().toISOString();
      tx.update(guildRef, {
        memberUids: removed.next.memberUids,
        members: removed.next.members,
        memberCount: removed.next.memberCount,
        updatedAt: nowIso,
      });

      // WHY: Only clear target user if still bound to *this* guild — prevents
      // wiping a concurrent rejoin to another crew.
      const targetGuildId = readUserGuildId(targetSnap.exists ? targetSnap.data() : null);
      if (targetGuildId === guildId) {
        tx.set(targetUserRef, userGuildClearPatch(nowIso), { merge: true });
      }
    });

    return { ok: true };
  } catch (err) {
    rethrowGuildError(err, "[kickGuildMember] unexpected", "kick-guild-member-failed");
  }
}

export const kickGuildMember = onCall(CALLABLE_OPTS, async (request) => {
  return runKickGuildMember(request);
});
