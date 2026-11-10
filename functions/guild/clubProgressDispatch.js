/**
 * Club Progress Dispatch — pure helpers (sanitize, delta gate, recipients, FCM copy).
 * WHY: Keep TX / Callable wiring thin; unit-test D2 positive-delta + mute filters without Firestore.
 */
import {
  CLUB_DISPATCH_ANDROID_CHANNEL_ID,
  CLUB_DISPATCH_COMMENT_MAX_LEN,
  CLUB_DISPATCH_MAX_PER_HOUR,
  ONE_HOUR_MS,
  SIX_AXIS_METRICS,
} from "../shared/constants.js";

/** FCM Admin codes that mean the stored device token must be cleared. */
export const FCM_STALE_REGISTRATION_ERROR_CODES = Object.freeze([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

/** @type {readonly string[]} */
export const CLUB_DISPATCH_METRICS = Object.freeze(["overall", ...SIX_AXIS_METRICS]);

/**
 * @param {unknown} raw
 * @returns {'overall' | string}
 */
export function normalizeBroadcastMetricType(raw) {
  if (typeof raw !== "string") return "overall";
  const trimmed = raw.trim();
  if (CLUB_DISPATCH_METRICS.includes(trimmed)) return trimmed;
  return "overall";
}

/**
 * @param {unknown} comment
 * @param {number} [maxLen]
 * @returns {string}
 */
export function sanitizeDispatchComment(comment, maxLen = CLUB_DISPATCH_COMMENT_MAX_LEN) {
  if (typeof comment !== "string") return "";
  const collapsed = comment
    .trim()
    .replace(/\s+/g, " ")
    // WHY: Match guild name XSS / control-char shield — push body must stay safe.
    .replace(/[<>\u0000-\u001F\u007F]/g, "");
  if (collapsed.length <= maxLen) return collapsed;
  return collapsed.slice(0, maxLen);
}

/**
 * Read previous score from a guild member snapshot BEFORE score overwrite.
 * Missing radar axis → 0 (first assessment may broadcast).
 * @param {unknown} member
 * @param {string} metricType
 * @returns {number}
 */
export function resolvePreviousScoreFromMember(member, metricType) {
  if (!member || typeof member !== "object") return 0;
  const metric = normalizeBroadcastMetricType(metricType);
  if (metric === "overall") {
    const n = Number(/** @type {{ ladderScore?: unknown }} */ (member).ladderScore);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }
  const radar = /** @type {{ radarScores?: Record<string, unknown> }} */ (member).radarScores;
  if (!radar || typeof radar !== "object") return 0;
  if (!Object.prototype.hasOwnProperty.call(radar, metric)) return 0;
  const n = Number(radar[metric]);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

/**
 * Authoritative newScore for broadcast delta (not client hint).
 * @param {{
 *   ladderScore: number;
 *   radarScores?: Record<string, number>;
 * }} input
 * @param {string} metricType
 * @returns {{ ok: true; newScore: number } | { ok: false; reason: 'invalid-metric-score' }}
 */
export function resolveBroadcastNewScore(input, metricType) {
  const metric = normalizeBroadcastMetricType(metricType);
  if (metric === "overall") {
    const n = Number(input?.ladderScore);
    if (!Number.isFinite(n) || n < 0) {
      return { ok: false, reason: "invalid-metric-score" };
    }
    return { ok: true, newScore: Math.max(0, n) };
  }
  const radar = input?.radarScores;
  if (!radar || typeof radar !== "object" || !Object.prototype.hasOwnProperty.call(radar, metric)) {
    return { ok: false, reason: "invalid-metric-score" };
  }
  const n = Number(radar[metric]);
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, reason: "invalid-metric-score" };
  }
  return { ok: true, newScore: Math.max(0, n) };
}

/**
 * D2 positive-growth gate — score sync must continue even when skipped.
 * @param {number} previousScore
 * @param {number} newScore
 * @returns {{
 *   ok: true;
 *   delta: number;
 * } | {
 *   ok: false;
 *   reason: 'non-positive-delta';
 *   delta: number;
 * }}
 */
export function evaluateBroadcastDeltaGate(previousScore, newScore) {
  const prev = Number(previousScore);
  const next = Number(newScore);
  const safePrev = Number.isFinite(prev) ? prev : 0;
  const safeNext = Number.isFinite(next) ? next : 0;
  // WHY: Align with 2dp score contract — avoid float dust (e.g. 10.2-10) failing equality checks.
  const delta = Math.round((safeNext - safePrev) * 100) / 100;
  if (!(delta > 0)) {
    return { ok: false, reason: "non-positive-delta", delta };
  }
  return { ok: true, delta };
}

/**
 * @param {unknown} raw
 * @returns {boolean}
 */
export function isValidFcmToken(raw) {
  return typeof raw === "string" && raw.trim().length >= 10;
}

/**
 * Filter memberUids → FCM recipients (exclude self / mute / missing token).
 * WHY: Multicast responses are index-aligned with tokens — keep `{ uid, token }` so
 * NotRegistered / InvalidRegistration can clear the owning user doc safely.
 * @param {string[]} memberUids
 * @param {string} senderUid
 * @param {Map<string, { muteClubDispatches?: boolean; fcmToken?: unknown }> | Record<string, { muteClubDispatches?: boolean; fcmToken?: unknown }>} userPrefsByUid
 * @returns {{
 *   recipients: Array<{ uid: string; token: string }>;
 *   tokens: string[];
 *   skippedMute: number;
 *   skippedNoToken: number;
 * }}
 */
export function filterDispatchRecipients(memberUids, senderUid, userPrefsByUid) {
  /** @type {Array<{ uid: string; token: string }>} */
  const recipients = [];
  const seenTokens = new Set();
  let skippedMute = 0;
  let skippedNoToken = 0;
  const list = Array.isArray(memberUids) ? memberUids : [];

  for (const uid of list) {
    if (typeof uid !== "string" || !uid || uid === senderUid) continue;
    const prefs =
      userPrefsByUid instanceof Map
        ? userPrefsByUid.get(uid)
        : userPrefsByUid && typeof userPrefsByUid === "object"
          ? userPrefsByUid[uid]
          : undefined;
    if (prefs && prefs.muteClubDispatches === true) {
      skippedMute += 1;
      continue;
    }
    const token = prefs?.fcmToken;
    if (!isValidFcmToken(token)) {
      skippedNoToken += 1;
      continue;
    }
    const trimmed = /** @type {string} */ (token).trim();
    // WHY: FCM multicast rejects duplicate tokens in one request; first owner wins for cleanup map.
    if (seenTokens.has(trimmed)) continue;
    seenTokens.add(trimmed);
    recipients.push({ uid, token: trimmed });
  }

  return {
    recipients,
    tokens: recipients.map((entry) => entry.token),
    skippedMute,
    skippedNoToken,
  };
}

/**
 * @param {unknown} code
 * @returns {boolean}
 */
export function isStaleFcmRegistrationErrorCode(code) {
  return (
    typeof code === "string" && FCM_STALE_REGISTRATION_ERROR_CODES.includes(code)
  );
}

/**
 * Compare-and-clear gate — true only when stored token still equals the failed send token.
 * @param {unknown} storedToken
 * @param {unknown} failedToken
 * @returns {boolean}
 */
export function shouldClearStoredFcmToken(storedToken, failedToken) {
  if (typeof storedToken !== "string" || typeof failedToken !== "string") {
    return false;
  }
  const current = storedToken.trim();
  const failed = failedToken.trim();
  return Boolean(current) && Boolean(failed) && current === failed;
}

/**
 * Pick multicast failures that warrant a Firestore token clear (index-aligned).
 * WHY: Keep Admin I/O thin and unit-test truncation / error-code filtering without FCM mocks.
 * @param {Array<{ uid: string; token: string }>} chunk
 * @param {Array<{ success?: boolean; error?: { code?: string } | null } | null | undefined>} responses
 * @param {{ alreadyCleared?: number; clearMax?: number }} [opts]
 * @returns {{
 *   targets: Array<{ uid: string; token: string; code: string }>;
 *   truncated: boolean;
 * }}
 */
export function selectStaleFcmClearTargets(chunk, responses, opts = {}) {
  const clearMax =
    typeof opts.clearMax === "number" && opts.clearMax >= 0 ? opts.clearMax : 50;
  const alreadyCleared =
    typeof opts.alreadyCleared === "number" && opts.alreadyCleared > 0
      ? Math.floor(opts.alreadyCleared)
      : 0;
  /** @type {Array<{ uid: string; token: string; code: string }>} */
  const targets = [];
  let truncated = false;
  const list = Array.isArray(responses) ? responses : [];
  const recipients = Array.isArray(chunk) ? chunk : [];

  for (let idx = 0; idx < list.length; idx += 1) {
    const resp = list[idx];
    if (!resp || resp.success) continue;
    const code = resp.error?.code;
    if (!isStaleFcmRegistrationErrorCode(code)) continue;
    const recipient = recipients[idx];
    if (!recipient?.uid || typeof recipient.token !== "string" || !recipient.token) {
      continue;
    }
    if (alreadyCleared + targets.length >= clearMax) {
      truncated = true;
      continue;
    }
    targets.push({
      uid: recipient.uid,
      token: recipient.token,
      code: /** @type {string} */ (code),
    });
  }

  return { targets, truncated };
}

/**
 * Compact score for push body (max 2dp, trim trailing zeros).
 * @param {number} n
 * @returns {string}
 */
export function formatDispatchScore(n) {
  if (!Number.isFinite(n)) return "0";
  const rounded = Math.round(n * 100) / 100;
  return String(rounded);
}

/**
 * Build zh-Hant notification copy + data payload (Phase 1 locale lock).
 * @param {{
 *   clubName: string;
 *   userName: string;
 *   newScore: number;
 *   delta: number;
 *   comment: string;
 *   senderUid: string;
 *   guildId: string;
 *   dispatchId?: string | null;
 * }} input
 */
export function buildClubDispatchNotification(input) {
  const clubName =
    typeof input.clubName === "string" && input.clubName.trim()
      ? input.clubName.trim()
      : "Club";
  const userName =
    typeof input.userName === "string" && input.userName.trim()
      ? input.userName.trim()
      : "Athlete";
  const scoreLabel = formatDispatchScore(input.newScore);
  const deltaLabel = formatDispatchScore(input.delta);
  const comment = typeof input.comment === "string" ? input.comment : "";

  const title = `【戰隊快報 // ${clubName}】`;
  const body =
    comment.length > 0
      ? `${userName} 戰鬥力推進至 ${scoreLabel}（+${deltaLabel}）！「${comment}」今天要去改造一下自己嗎？`
      : `${userName} 戰鬥力推進至 ${scoreLabel}（+${deltaLabel}）！今天要去改造一下自己嗎？`;

  /** @type {Record<string, string>} */
  const data = {
    type: "club_progress_dispatch",
    route: `/crew?focusUid=${encodeURIComponent(input.senderUid)}`,
    guildId: input.guildId,
    focusUid: input.senderUid,
  };
  if (input.dispatchId) {
    data.dispatchId = input.dispatchId;
  }

  const notification = { title, body };
  return {
    notification,
    data,
    // WHY: Explicit aps.alert prevents iOS from treating the message as badge-only silent push
    // when FCM's top-level notification mapping is incomplete on some APNs paths.
    apns: buildClubDispatchApnsPayload(notification),
    // WHY: Bind Android 8+ channel so FCM does not fall back to the SDK default (no heads-up).
    android: buildClubDispatchAndroidPayload(),
  };
}

/**
 * Android FCM block — high priority + club_dispatches channel for heads-up banners.
 * @returns {{
 *   priority: 'high';
 *   notification: {
 *     channelId: string;
 *     priority: 'high';
 *     defaultSound: true;
 *     defaultVibrateTimings: true;
 *   };
 * }}
 */
export function buildClubDispatchAndroidPayload() {
  return {
    priority: "high",
    notification: {
      channelId: CLUB_DISPATCH_ANDROID_CHANNEL_ID,
      priority: "high",
      defaultSound: true,
      defaultVibrateTimings: true,
    },
  };
}

/**
 * @param {{ title: string; body: string }} notification
 * @returns {{ payload: { aps: Record<string, unknown> } }}
 */
export function buildClubDispatchApnsPayload(notification) {
  const title =
    typeof notification?.title === "string" ? notification.title : "";
  const body = typeof notification?.body === "string" ? notification.body : "";
  return {
    payload: {
      aps: {
        alert: { title, body },
        sound: "default",
        badge: 1,
      },
    },
  };
}

/**
 * @param {unknown} raw
 * @param {number} [nowMs]
 * @param {number} [windowMs]
 * @returns {{ windowStartMs: number; count: number }}
 */
export function normalizeClubDispatchRateDoc(
  raw,
  nowMs = Date.now(),
  windowMs = ONE_HOUR_MS
) {
  if (!raw || typeof raw !== "object") {
    return { windowStartMs: nowMs, count: 0 };
  }
  const windowStartMs = Number(/** @type {{ windowStartMs?: unknown }} */ (raw).windowStartMs) || nowMs;
  if (nowMs - windowStartMs >= windowMs) {
    return { windowStartMs: nowMs, count: 0 };
  }
  return {
    windowStartMs,
    count: Math.max(
      0,
      Math.floor(Number(/** @type {{ count?: unknown }} */ (raw).count) || 0)
    ),
  };
}

/**
 * Consume one successful-broadcast slot (call only when about to send FCM).
 * @param {unknown} raw
 * @param {number} [nowMs]
 * @param {{ windowMs?: number; maxAttempts?: number }} [opts]
 */
export function consumeClubDispatchAttempt(raw, nowMs = Date.now(), opts = {}) {
  const windowMs = opts.windowMs ?? ONE_HOUR_MS;
  const maxAttempts = opts.maxAttempts ?? CLUB_DISPATCH_MAX_PER_HOUR;
  const bucket = normalizeClubDispatchRateDoc(raw, nowMs, windowMs);
  const resetAt = new Date(bucket.windowStartMs + windowMs).toISOString();

  if (bucket.count >= maxAttempts) {
    return {
      allowed: false,
      reason: "rate-limited",
      remaining: 0,
      resetAt,
      next: bucket,
    };
  }

  const next = {
    windowStartMs: bucket.windowStartMs,
    count: bucket.count + 1,
  };
  return {
    allowed: true,
    remaining: Math.max(0, maxAttempts - next.count),
    resetAt,
    next,
  };
}

/**
 * Decide broadcastSkipped before I/O (pure).
 * @param {{
 *   broadcast: boolean;
 *   previousScore: number;
 *   ladderScore: number;
 *   radarScores?: Record<string, number>;
 *   broadcastMetricType?: string;
 * }} input
 * @returns {{
 *   proceed: false;
 *   broadcastSkipped:
 *     | 'not-requested'
 *     | 'non-positive-delta'
 *     | 'invalid-metric-score';
 *   delta?: number;
 *   newScore?: number;
 *   previousScore?: number;
 *   comment?: undefined;
 * } | {
 *   proceed: true;
 *   delta: number;
 *   newScore: number;
 *   previousScore: number;
 *   metricType: string;
 * }}
 */
export function resolveBroadcastIntent(input) {
  if (input.broadcast !== true) {
    return { proceed: false, broadcastSkipped: "not-requested" };
  }
  const metricType = normalizeBroadcastMetricType(input.broadcastMetricType);
  const newScoreResult = resolveBroadcastNewScore(
    { ladderScore: input.ladderScore, radarScores: input.radarScores },
    metricType
  );
  if (!newScoreResult.ok) {
    return { proceed: false, broadcastSkipped: "invalid-metric-score" };
  }
  const gate = evaluateBroadcastDeltaGate(input.previousScore, newScoreResult.newScore);
  if (!gate.ok) {
    return {
      proceed: false,
      broadcastSkipped: "non-positive-delta",
      delta: gate.delta,
      newScore: newScoreResult.newScore,
      previousScore: input.previousScore,
    };
  }
  return {
    proceed: true,
    delta: gate.delta,
    newScore: newScoreResult.newScore,
    previousScore: input.previousScore,
    metricType,
  };
}
