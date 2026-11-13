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
 * Defensive FCM data.comment cap (production sanitize is already ≤25).
 * WHY: Keep data payload far under FCM 4KB while allowing safe forward-compat.
 */
export const CLUB_DISPATCH_FCM_COMMENT_DATA_MAX = 300;

/**
 * Physiology labels for Club Dispatch push bodies (Functions SSOT — do not pull client i18n).
 * WHY: Keep copy free of vehicle metaphors; zh + en share the same metric keys.
 */
export const CLUB_DISPATCH_METRIC_LABELS_ZH = Object.freeze({
  strength: "最大肌力",
  explosivePower: "爆發力",
  cardio: "心肺耐力",
  muscleMass: "骨骼肌量",
  bodyFat: "FFMI",
  gripStrength: "握力",
});

/** Keep parity with client `home.radar.axisChart` / physiology chart SSOT. */
export const CLUB_DISPATCH_METRIC_LABELS_EN = Object.freeze({
  strength: "Max Strength",
  explosivePower: "Explosive Power",
  cardio: "Cardio Endurance",
  muscleMass: "Skeletal Muscle",
  bodyFat: "FFMI",
  gripStrength: "Grip",
});

/**
 * Push title/body templates.
 * WHY: Android lock-screen title ≈15 CJK chars — nickname-first title + comment in body line 1.
 * @type {Readonly<Record<'zh-Hant' | 'en', {
 *   titleFallback: (clubName: string) => string;
 *   titleWithComment: (userName: string, clubName: string) => string;
 *   bodyAxis: (comment: string, metricLabel: string, axisScore: string, overallScore: string, deltaSuffix: string) => string;
 *   bodyAxisNoComment: (userName: string, metricLabel: string, axisScore: string, overallScore: string, deltaSuffix: string) => string;
 *   bodyOverall: (comment: string, overallScore: string, deltaSuffix: string) => string;
 *   bodyOverallNoComment: (userName: string, overallScore: string, deltaSuffix: string) => string;
 * }>>}
 */
export const CLUB_DISPATCH_COPY = Object.freeze({
  "zh-Hant": Object.freeze({
    titleFallback: (clubName) => `【戰隊快報 // ${clubName}】`,
    // WHY: Nickname first so lock-screen ~15 CJK truncates clubName, not the speaker.
    titleWithComment: (userName, clubName) => `${userName} · ${clubName}`,
    bodyAxis: (comment, metricLabel, axisScore, overallScore, deltaSuffix) =>
      `「${comment}」\n${metricLabel} ${axisScore} ➔ 總戰力 ${overallScore}${deltaSuffix}`,
    bodyAxisNoComment: (userName, metricLabel, axisScore, overallScore, deltaSuffix) =>
      `${userName} 突破【${metricLabel}】${axisScore} ➔ 總戰力 ${overallScore}${deltaSuffix}`,
    bodyOverall: (comment, overallScore, deltaSuffix) =>
      `「${comment}」\n總戰力 ➔ ${overallScore}${deltaSuffix}`,
    bodyOverallNoComment: (userName, overallScore, deltaSuffix) =>
      `${userName} 總戰力 ➔ ${overallScore}${deltaSuffix}`,
  }),
  en: Object.freeze({
    titleFallback: (clubName) => `[Squad Dispatch // ${clubName}]`,
    titleWithComment: (userName, clubName) => `${userName} · ${clubName}`,
    bodyAxis: (comment, metricLabel, axisScore, overallScore, deltaSuffix) =>
      `"${comment}"\n${metricLabel} ${axisScore} ➔ Total ${overallScore}${deltaSuffix}`,
    bodyAxisNoComment: (userName, metricLabel, axisScore, overallScore, deltaSuffix) =>
      `${userName} hit [${metricLabel}] ${axisScore} ➔ Total ${overallScore}${deltaSuffix}`,
    bodyOverall: (comment, overallScore, deltaSuffix) =>
      `"${comment}"\nTotal Power ➔ ${overallScore}${deltaSuffix}`,
    bodyOverallNoComment: (userName, overallScore, deltaSuffix) =>
      `${userName} Total Power ➔ ${overallScore}${deltaSuffix}`,
  }),
});

/**
 * Normalize push locale. Default zh-Hant; any en* tag → en.
 * @param {unknown} raw
 * @returns {'zh-Hant' | 'en'}
 */
export function resolveClubDispatchLocale(raw) {
  if (typeof raw !== "string") return "zh-Hant";
  const tag = raw.trim().toLowerCase().replace(/_/g, "-");
  if (tag === "en" || tag.startsWith("en-")) return "en";
  return "zh-Hant";
}

/**
 * @param {unknown} metricType
 * @param {'zh-Hant' | 'en'} [locale]
 * @returns {string | null}
 */
export function resolveClubDispatchMetricLabel(metricType, locale = "zh-Hant") {
  if (typeof metricType !== "string") return null;
  const key = metricType.trim();
  const table =
    resolveClubDispatchLocale(locale) === "en"
      ? CLUB_DISPATCH_METRIC_LABELS_EN
      : CLUB_DISPATCH_METRIC_LABELS_ZH;
  if (!Object.prototype.hasOwnProperty.call(table, key)) return null;
  return table[/** @type {keyof typeof table} */ (key)];
}

/**
 * @param {unknown} metricType
 * @returns {string | null}
 */
export function resolveClubDispatchMetricLabelZh(metricType) {
  return resolveClubDispatchMetricLabel(metricType, "zh-Hant");
}

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
    // WHY: Match guild name XSS / control-char shield — push title/body must stay safe.
    .replace(/[<>\u0000-\u001F\u007F]/g, "");
  if (collapsed.length <= maxLen) return collapsed;
  return collapsed.slice(0, maxLen);
}

/**
 * @param {unknown} raw
 * @param {string} fallback
 * @returns {string}
 */
function normalizeDispatchDisplayName(raw, fallback) {
  return typeof raw === "string" && raw.trim() ? raw.trim() : fallback;
}

/**
 * Axis metric key check — locale-agnostic (label tables share the same keys).
 * @param {unknown} metricType
 * @returns {boolean}
 */
export function isClubDispatchAxisMetric(metricType) {
  if (typeof metricType !== "string") return false;
  const key = metricType.trim();
  return Object.prototype.hasOwnProperty.call(CLUB_DISPATCH_METRIC_LABELS_ZH, key);
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
 * Append overall delta suffix only for positive overall growth.
 * WHY: Non-positive overall Δ (rebalance / flat ladder) should not imply a false total climb.
 * @param {number} overallDelta
 * @returns {string}
 */
export function formatOverallDeltaSuffix(overallDelta) {
  const delta = Number(overallDelta);
  if (!Number.isFinite(delta) || !(delta > 0)) return "";
  return ` (+${formatDispatchScore(delta)})`;
}

/**
 * @param {{
 *   userName?: string | null;
 *   metricType?: string | null;
 *   axisScore?: number | null;
 *   overallScore: number;
 *   overallDelta: number;
 *   comment?: string | null;
 *   locale?: string | null;
 * }} input
 * @returns {{
 *   userName: string;
 *   comment: string;
 *   hasComment: boolean;
 *   hasAxis: boolean;
 *   metricLabel: string | null;
 *   axisScoreLabel: string;
 *   overallLabel: string;
 *   deltaSuffix: string;
 *   copy: (typeof CLUB_DISPATCH_COPY)['zh-Hant'];
 * }}
 */
function resolveClubDispatchCopyContext(input) {
  const locale = resolveClubDispatchLocale(input?.locale);
  const copy = CLUB_DISPATCH_COPY[locale];
  const userName = normalizeDispatchDisplayName(input?.userName, "Athlete");
  const comment =
    typeof input?.comment === "string" ? input.comment.trim() : "";
  const overallLabel = formatDispatchScore(input.overallScore);
  const deltaSuffix = formatOverallDeltaSuffix(input.overallDelta);
  const metricType = normalizeBroadcastMetricType(input.metricType);
  const metricLabel = resolveClubDispatchMetricLabel(metricType, locale);
  const axisRaw = Number(input.axisScore);
  const hasAxis =
    metricType !== "overall" &&
    metricLabel != null &&
    Number.isFinite(axisRaw) &&
    axisRaw >= 0;

  return {
    userName,
    comment,
    hasComment: comment.length > 0,
    hasAxis,
    metricLabel,
    axisScoreLabel: formatDispatchScore(axisRaw),
    overallLabel,
    deltaSuffix,
    copy,
  };
}

/**
 * Title: sender · club when comment exists (comment itself goes in body line 1).
 * @param {{
 *   clubName: string;
 *   userName?: string | null;
 *   comment?: string | null;
 *   locale?: string | null;
 * }} input
 * @returns {string}
 */
export function buildClubDispatchTitle(input) {
  const locale = resolveClubDispatchLocale(input?.locale);
  const copy = CLUB_DISPATCH_COPY[locale];
  const clubName = normalizeDispatchDisplayName(input?.clubName, "Club");
  const userName = normalizeDispatchDisplayName(input?.userName, "Athlete");
  const comment =
    typeof input?.comment === "string" ? input.comment.trim() : "";
  if (comment.length > 0) {
    return copy.titleWithComment(userName, clubName);
  }
  return copy.titleFallback(clubName);
}

/**
 * Body: with comment → quoted line + score line; without → nickname + score (single line).
 * @param {{
 *   userName?: string | null;
 *   metricType?: string | null;
 *   axisScore?: number | null;
 *   overallScore: number;
 *   overallDelta: number;
 *   comment?: string | null;
 *   locale?: string | null;
 * }} input
 * @returns {string}
 */
export function buildClubDispatchBody(input) {
  const {
    copy,
    userName,
    comment,
    hasComment,
    hasAxis,
    metricLabel,
    axisScoreLabel,
    overallLabel,
    deltaSuffix,
  } = resolveClubDispatchCopyContext(input);

  if (hasAxis) {
    // hasAxis already implies metricLabel is a non-null string.
    const label = /** @type {string} */ (metricLabel);
    return hasComment
      ? copy.bodyAxis(comment, label, axisScoreLabel, overallLabel, deltaSuffix)
      : copy.bodyAxisNoComment(
          userName,
          label,
          axisScoreLabel,
          overallLabel,
          deltaSuffix
        );
  }

  return hasComment
    ? copy.bodyOverall(comment, overallLabel, deltaSuffix)
    : copy.bodyOverallNoComment(userName, overallLabel, deltaSuffix);
}

/**
 * Resolve push score fields without mislabeling axis legacy scores as overall.
 * WHY: Older smoke helpers passed `newScore`/`delta` only — never invent overall from an axis score.
 * @param {{
 *   metricType?: string | null;
 *   axisScore?: number | null;
 *   overallScore?: number;
 *   overallDelta?: number;
 *   newScore?: number;
 *   delta?: number;
 * }} input
 * @returns {{
 *   metricType: string;
 *   axisScore: number | null;
 *   overallScore: number;
 *   overallDelta: number;
 * }}
 */
export function resolveClubDispatchNotificationScores(input) {
  const metricType = normalizeBroadcastMetricType(input?.metricType);
  const isAxisMetric = isClubDispatchAxisMetric(metricType);
  const hasOverall = Number.isFinite(Number(input?.overallScore));
  const hasAxis = Number.isFinite(Number(input?.axisScore));
  const hasLegacyScore = Number.isFinite(Number(input?.newScore));
  const hasOverallDelta = Number.isFinite(Number(input?.overallDelta));
  const hasLegacyDelta = Number.isFinite(Number(input?.delta));

  /** @type {number | null} */
  let axisScore = hasAxis ? Number(input.axisScore) : null;
  if (axisScore == null && isAxisMetric && hasLegacyScore && !hasOverall) {
    axisScore = Number(input.newScore);
  }

  let overallScore = 0;
  if (hasOverall) {
    overallScore = Number(input.overallScore);
  } else if (!isAxisMetric && hasLegacyScore) {
    overallScore = Number(input.newScore);
  }

  let overallDelta = 0;
  if (hasOverallDelta) {
    overallDelta = Number(input.overallDelta);
  } else if (!isAxisMetric && hasLegacyDelta) {
    overallDelta = Number(input.delta);
  }

  return { metricType, axisScore, overallScore, overallDelta };
}

/**
 * Build notification copy + data payload (zh-Hant default; pass locale: 'en' for English).
 * Prefer overallScore/axisScore/overallDelta; newScore/delta are overall-only legacy fallbacks.
 * @param {{
 *   clubName: string;
 *   userName: string;
 *   metricType?: string | null;
 *   axisScore?: number | null;
 *   overallScore?: number;
 *   overallDelta?: number;
 *   newScore?: number;
 *   delta?: number;
 *   comment: string;
 *   senderUid: string;
 *   guildId: string;
 *   dispatchId?: string | null;
 *   locale?: string | null;
 * }} input
 */
export function buildClubDispatchNotification(input) {
  const clubName = normalizeDispatchDisplayName(input.clubName, "Club");
  const userName = normalizeDispatchDisplayName(input.userName, "Athlete");
  // WHY: Locale is opt-in until broadcast wires users.locale; default zh-Hant keeps multicast stable.
  const locale = resolveClubDispatchLocale(input.locale);
  // WHY: Defense-in-depth — Callable already sanitizes, but admin/smoke/legacy callers must not
  // leak control chars or overlong text into title/body/data.
  const comment = sanitizeDispatchComment(input.comment);

  const scores = resolveClubDispatchNotificationScores(input);

  const title = buildClubDispatchTitle({
    clubName,
    userName,
    comment,
    locale,
  });
  const body = buildClubDispatchBody({
    userName,
    metricType: scores.metricType,
    axisScore: scores.axisScore,
    overallScore: scores.overallScore,
    overallDelta: scores.overallDelta,
    comment,
    locale,
  });

  /** @type {Record<string, string>} */
  const data = {
    type: "club_progress_dispatch",
    route: `/crew?focusUid=${encodeURIComponent(input.senderUid)}`,
    guildId: input.guildId,
    focusUid: input.senderUid,
    metricType: scores.metricType,
    overallScore: formatDispatchScore(scores.overallScore),
    overallDelta: formatDispatchScore(scores.overallDelta),
  };
  if (scores.axisScore != null && Number.isFinite(scores.axisScore)) {
    data.axisScore = formatDispatchScore(scores.axisScore);
  }
  // WHY: Deliver comment via FCM data for 0 Firestore reads on tap — never fetch dispatch docs.
  // Belt-and-suspenders cap keeps data payload bounded even if sanitize max drifts.
  if (comment.length > 0) {
    data.comment = comment.slice(0, CLUB_DISPATCH_FCM_COMMENT_DATA_MAX);
  }
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
