/**
 * joinGuild — Free-eligible join via invite code (Single Guild Guard + 30 cap).
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import {
  CALLABLE_OPTS,
  GUILD_INVITE_CODES_COLLECTION,
  GUILD_JOIN_RATE_LIMITS_COLLECTION,
  GUILDS_COLLECTION,
} from "../shared/constants.js";
import { db } from "../shared/admin.js";
import { requireSignedInUid, rethrowGuildError } from "./guildAuth.js";
import {
  appendGuildMember,
  assertCanJoinGuild,
  buildMemberSnapshot,
  consumeGuildJoinAttempt,
  sanitizeAvatarUrl,
  sanitizeDisplayName,
} from "./guildCore.js";
import { sanitizeGuildRadarScores } from "./guildRadarScores.js";
import { isValidInviteCodeShape, normalizeInviteCode } from "./guildInviteCode.js";
import { userGuildBindPatch } from "./guildUserFields.js";

/**
 * WHY: Count every guess (invalid code / full) so short codes cannot be swept.
 * Already-in-guild is checked before burning quota (not an enumeration probe).
 */
async function assertAndConsumeJoinAttempt(uid) {
  const rateRef = db.collection(GUILD_JOIN_RATE_LIMITS_COLLECTION).doc(uid);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(rateRef);
    const nowMs = Date.now();
    const result = consumeGuildJoinAttempt(snap.data() ?? null, nowMs);
    if (!result.allowed) {
      throw new HttpsError("resource-exhausted", "guild-join-rate-limited");
    }
    tx.set(
      rateRef,
      {
        windowStartMs: result.next.windowStartMs,
        count: result.next.count,
        updatedAt: new Date(nowMs).toISOString(),
      },
      { merge: true }
    );
  });
}

/**
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 */
export async function runJoinGuild(request) {
  const uid = requireSignedInUid(request);

  const data = request.data || {};
  const code = normalizeInviteCode(data.code);
  const userRef = db.collection("users").doc(uid);

  // Fast Single Guild Guard — do not burn join quota for "already in a crew".
  const earlyUserSnap = await userRef.get();
  const earlyGate = assertCanJoinGuild(earlyUserSnap.exists ? earlyUserSnap.data() : null);
  if (!earlyGate.ok) {
    throw new HttpsError("failed-precondition", earlyGate.reason);
  }

  if (!isValidInviteCodeShape(code)) {
    await assertAndConsumeJoinAttempt(uid);
    throw new HttpsError("not-found", "invalid-code");
  }

  await assertAndConsumeJoinAttempt(uid);

  const displayName = sanitizeDisplayName(data.displayName, uid);
  const avatarUrl = sanitizeAvatarUrl(data.avatarUrl);
  const ladderScore = Number(data.ladderScore);
  const radarScores = sanitizeGuildRadarScores(data.radarScores);
  const inviteRef = db.collection(GUILD_INVITE_CODES_COLLECTION).doc(code);

  try {
    return await db.runTransaction(async (tx) => {
      const [userSnap, inviteSnap] = await Promise.all([
        tx.get(userRef),
        tx.get(inviteRef),
      ]);

      const userData = userSnap.exists ? userSnap.data() : null;
      const joinGate = assertCanJoinGuild(userData);
      if (!joinGate.ok) {
        throw new HttpsError("failed-precondition", joinGate.reason);
      }

      if (!inviteSnap.exists) {
        throw new HttpsError("not-found", "invalid-code");
      }
      const invite = inviteSnap.data() || {};
      const guildId = typeof invite.guildId === "string" ? invite.guildId : "";
      if (!guildId) {
        throw new HttpsError("not-found", "invalid-code");
      }

      const guildRef = db.collection(GUILDS_COLLECTION).doc(guildId);
      const guildSnap = await tx.get(guildRef);
      if (!guildSnap.exists) {
        throw new HttpsError("not-found", "not-found");
      }
      const guildData = guildSnap.data() || {};
      if (guildData.status === "disbanded") {
        throw new HttpsError("failed-precondition", "not-found");
      }

      const nowIso = new Date().toISOString();
      const snapshot = buildMemberSnapshot({
        uid,
        displayName,
        avatarUrl,
        ladderScore: Number.isFinite(ladderScore) ? ladderScore : 0,
        radarScores,
        updatedAt: nowIso,
      });
      const appended = appendGuildMember(guildData, snapshot);
      if (!appended.ok) {
        if (appended.reason === "guild-full") {
          throw new HttpsError("resource-exhausted", "guild-full");
        }
        throw new HttpsError("failed-precondition", appended.reason);
      }

      tx.update(guildRef, {
        memberUids: appended.next.memberUids,
        members: appended.next.members,
        memberCount: appended.next.memberCount,
        updatedAt: nowIso,
      });
      tx.set(
        userRef,
        userGuildBindPatch({ guildId, guildRole: "member", nowIso }),
        { merge: true }
      );

      return {
        ok: true,
        guildId,
        name: typeof guildData.name === "string" ? guildData.name : "",
        tag: typeof guildData.tag === "string" ? guildData.tag : "",
        memberCount: appended.next.memberCount,
      };
    });
  } catch (err) {
    rethrowGuildError(err, "[joinGuild] unexpected", "join-guild-failed");
  }
}

export const joinGuild = onCall(CALLABLE_OPTS, async (request) => {
  return runJoinGuild(request);
});
