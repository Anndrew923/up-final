/**
 * Club Progress Dispatch — post-commit FCM fan-out (I/O).
 * WHY: Keep syncGuildScoreCallable thin; score TX already committed before this runs.
 */
import {
  CLUB_DISPATCH_RATE_LIMITS_COLLECTION,
  CLUB_DISPATCH_SUBCOLLECTION,
  GUILDS_COLLECTION,
} from "../shared/constants.js";
import { db, messaging } from "../shared/admin.js";
import {
  buildClubDispatchApnsPayload,
  buildClubDispatchNotification,
  consumeClubDispatchAttempt,
  filterDispatchRecipients,
  resolveBroadcastIntent,
} from "./clubProgressDispatch.js";

const FCM_MULTICAST_MAX = 500;
/** Cap per-token failure lines so a bad token blast cannot flood Cloud Logging. */
const FCM_TOKEN_FAILURE_LOG_MAX = 20;

/**
 * Structured skip log — surfaces broadcastSkipped in Cloud Logging without client Network.
 * @param {string} guildId
 * @param {string} publisherUid
 * @param {string} reason
 * @param {Record<string, unknown>} [extra]
 */
function logClubDispatchSkipped(guildId, publisherUid, reason, extra) {
  console.info(
    `[ClubDispatch] Skipped for guild ${guildId}, user ${publisherUid}: reason=${reason}`
  );
  if (extra && Object.keys(extra).length > 0) {
    console.info("[ClubDispatch] Skip detail", extra);
  }
}

/**
 * Load mute / fcmToken prefs for candidate recipients (Admin SDK).
 * @param {string[]} uids
 * @returns {Promise<Map<string, { muteClubDispatches?: boolean; fcmToken?: unknown }>>}
 */
export async function loadDispatchRecipientPrefs(uids) {
  /** @type {Map<string, { muteClubDispatches?: boolean; fcmToken?: unknown }>} */
  const map = new Map();
  const unique = [...new Set(uids.filter((id) => typeof id === "string" && id))];
  const chunkSize = 100;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const refs = chunk.map((id) => db.collection("users").doc(id));
    const snaps = await db.getAll(...refs);
    for (const snap of snaps) {
      if (!snap.exists) continue;
      const data = snap.data() || {};
      map.set(snap.id, {
        muteClubDispatches: data.muteClubDispatches === true,
        fcmToken: data.fcmToken,
      });
    }
  }
  return map;
}

/**
 * Atomically consume one broadcast slot. Returns null when rate-limited.
 * WHY: Avoid TOCTOU double-spend when two Breakthrough syncs race in the same hour.
 * @param {string} uid
 * @returns {Promise<{ allowed: true } | { allowed: false; reason: 'rate-limited' }>}
 */
export async function consumeClubDispatchRateSlot(uid) {
  const rateRef = db.collection(CLUB_DISPATCH_RATE_LIMITS_COLLECTION).doc(uid);
  /** @type {{ allowed: boolean; reason?: string }} */
  const out = { allowed: false, reason: "rate-limited" };

  await db.runTransaction(async (tx) => {
    const rateSnap = await tx.get(rateRef);
    const consumed = consumeClubDispatchAttempt(rateSnap.exists ? rateSnap.data() : null);
    if (!consumed.allowed) {
      out.allowed = false;
      out.reason = "rate-limited";
      return;
    }
    tx.set(
      rateRef,
      {
        windowStartMs: consumed.next.windowStartMs,
        count: consumed.next.count,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    out.allowed = true;
    delete out.reason;
  });

  return /** @type {{ allowed: true } | { allowed: false; reason: 'rate-limited' }} */ (out);
}

/**
 * @param {string[]} tokens
 * @param {{
 *   notification: { title: string; body: string };
 *   data: Record<string, string>;
 *   apns?: { payload: { aps: Record<string, unknown> } };
 * }} payload
 */
export async function sendClubDispatchMulticast(tokens, payload) {
  let fcmSuccessCount = 0;
  let fcmFailureCount = 0;
  let tokenFailuresLogged = 0;

  for (let i = 0; i < tokens.length; i += FCM_MULTICAST_MAX) {
    const chunk = tokens.slice(i, i + FCM_MULTICAST_MAX);
    try {
      const response = await messaging.sendEachForMulticast({
        tokens: chunk,
        notification: payload.notification,
        data: payload.data,
        // Prefer builder-supplied apns; fall back via shared helper (never badge-only).
        apns:
          payload.apns ??
          (payload.notification
            ? buildClubDispatchApnsPayload(payload.notification)
            : undefined),
      });
      const successCount = response.successCount ?? 0;
      const failureCount = response.failureCount ?? 0;
      fcmSuccessCount += successCount;
      fcmFailureCount += failureCount;

      // WHY: Per-token errors (InvalidRegistration / NotRegistered) are otherwise invisible in Cloud Logging.
      const responses = Array.isArray(response.responses) ? response.responses : [];
      for (let idx = 0; idx < responses.length; idx += 1) {
        const resp = responses[idx];
        if (!resp || resp.success) continue;
        if (tokenFailuresLogged >= FCM_TOKEN_FAILURE_LOG_MAX) continue;
        tokenFailuresLogged += 1;
        const err = resp.error;
        console.warn("[ClubDispatch] Multicast token failed", {
          code: err?.code ?? null,
          message: err?.message ?? String(err ?? "unknown"),
          tokenSuffix:
            typeof chunk[idx] === "string" && chunk[idx].length > 8
              ? chunk[idx].slice(-8)
              : null,
        });
      }
    } catch (err) {
      console.warn("[ClubDispatch] FCM multicast chunk failed (non-fatal)", {
        message: err?.message ?? String(err),
        chunkSize: chunk.length,
      });
      fcmFailureCount += chunk.length;
    }
  }

  // WHY: One totals line after all chunks — avoids ambiguous per-chunk "finished" noise.
  console.info(
    `[ClubDispatch] Multicast finished: success=${fcmSuccessCount}, failure=${fcmFailureCount}`
  );
  if (fcmFailureCount > tokenFailuresLogged) {
    console.info("[ClubDispatch] Multicast token failure logs truncated", {
      logged: tokenFailuresLogged,
      failureTotal: fcmFailureCount,
      cap: FCM_TOKEN_FAILURE_LOG_MAX,
    });
  }

  return { fcmSuccessCount, fcmFailureCount };
}

/**
 * After successful score fan-out: intent → recipients → throttle TX → dispatch doc → FCM.
 * Never throws — score path already committed.
 * @param {{
 *   uid: string;
 *   normalized: {
 *     ladderScore: number;
 *     radarScores?: Record<string, number>;
 *     broadcast: boolean;
 *     comment: string;
 *     broadcastMetricType: string;
 *     displayName: string;
 *   };
 *   guildId: string;
 *   broadcastBaseline: {
 *     previousScore: number;
 *     senderDisplayName: string;
 *     memberUids: string[];
 *     clubName: string;
 *     metricType: string;
 *   } | null;
 * }} input
 */
export async function runClubProgressBroadcastAfterFanOut(input) {
  const { uid, normalized, guildId, broadcastBaseline } = input;

  if (normalized.broadcast !== true) {
    // WHY: Silent sync is the common path; avoid Cloud Logging spam (caller may also short-circuit).
    return { broadcastSkipped: "not-requested" };
  }

  if (!broadcastBaseline) {
    // Unreachable when fan-out patched successfully (member must exist); defensive only.
    logClubDispatchSkipped(guildId, uid, "invalid-metric-score");
    return { broadcastSkipped: "invalid-metric-score" };
  }

  const intent = resolveBroadcastIntent({
    broadcast: true,
    previousScore: broadcastBaseline.previousScore,
    ladderScore: normalized.ladderScore,
    radarScores: normalized.radarScores,
    broadcastMetricType: broadcastBaseline.metricType || normalized.broadcastMetricType,
  });

  if (!intent.proceed) {
    const reason = intent.broadcastSkipped || "unknown";
    logClubDispatchSkipped(guildId, uid, reason, {
      delta: intent.delta ?? null,
      metricType: intent.metricType ?? null,
    });
    return {
      broadcastSkipped: intent.broadcastSkipped,
      ...(intent.delta != null ? { delta: intent.delta } : {}),
    };
  }

  const prefs = await loadDispatchRecipientPrefs(broadcastBaseline.memberUids);
  const filtered = filterDispatchRecipients(broadcastBaseline.memberUids, uid, prefs);
  const { tokens } = filtered;
  if (tokens.length === 0) {
    logClubDispatchSkipped(guildId, uid, "no-recipients", {
      memberCount: broadcastBaseline.memberUids?.length ?? 0,
      skippedMute: filtered.skippedMute,
      skippedNoToken: filtered.skippedNoToken,
    });
    return {
      broadcastSkipped: "no-recipients",
      delta: intent.delta,
      fcmSuccessCount: 0,
      fcmFailureCount: 0,
    };
  }

  const rate = await consumeClubDispatchRateSlot(uid);
  if (!rate.allowed) {
    logClubDispatchSkipped(guildId, uid, "rate-limited", { delta: intent.delta });
    return {
      broadcastSkipped: "rate-limited",
      delta: intent.delta,
    };
  }

  // Prefer just-synced displayName (written in same fan-out); fall back to pre-write snapshot.
  const senderDisplayName =
    (typeof normalized.displayName === "string" && normalized.displayName.trim()
      ? normalized.displayName.trim()
      : "") ||
    broadcastBaseline.senderDisplayName ||
    uid.slice(0, 8);

  const dispatchRef = db
    .collection(GUILDS_COLLECTION)
    .doc(guildId)
    .collection(CLUB_DISPATCH_SUBCOLLECTION)
    .doc();
  const dispatchId = dispatchRef.id;
  const nowIso = new Date().toISOString();

  try {
    await dispatchRef.set({
      id: dispatchId,
      guildId,
      senderUid: uid,
      senderDisplayName,
      metricType: intent.metricType,
      previousScore: intent.previousScore,
      newScore: intent.newScore,
      delta: intent.delta,
      comment: normalized.comment,
      createdAt: nowIso,
      fcmSentCount: 0,
    });
  } catch (err) {
    console.warn("[ClubDispatch] dispatch doc write failed (non-fatal)", {
      uid,
      guildId,
      message: err?.message ?? String(err),
    });
  }

  const payload = buildClubDispatchNotification({
    clubName: broadcastBaseline.clubName,
    userName: senderDisplayName,
    newScore: intent.newScore,
    delta: intent.delta,
    comment: normalized.comment,
    senderUid: uid,
    guildId,
    dispatchId,
  });

  console.info("[ClubDispatch] Sending multicast", {
    guildId,
    publisherUid: uid,
    dispatchId,
    tokenCount: tokens.length,
    metricType: intent.metricType,
    delta: intent.delta,
  });

  const { fcmSuccessCount, fcmFailureCount } = await sendClubDispatchMulticast(tokens, payload);

  try {
    await dispatchRef.set({ fcmSentCount: fcmSuccessCount }, { merge: true });
  } catch {
    // best-effort tally
  }

  return {
    delta: intent.delta,
    dispatchId,
    fcmSuccessCount,
    fcmFailureCount,
  };
}
