/**
 * Club Progress Dispatch prefs — FCM token upsert + mute toggle.
 * WHY: users/{uid} client rules only allow terms acceptance fields; Admin SDK via Callable.
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { CALLABLE_OPTS } from "../shared/constants.js";
import { db, FieldValue } from "../shared/admin.js";
import { requireSignedInUid, rethrowGuildError } from "./guildAuth.js";
import { isValidFcmToken } from "./clubProgressDispatch.js";
import {
  IOS_BUNDLE_ID,
  isApnsDeviceToken,
  resolvePushCredentialToFcm,
} from "./apnsToFcmToken.js";

const FCM_PLATFORMS = new Set(["ios", "android", "web"]);

/**
 * @param {unknown} raw
 * @returns {'ios' | 'android' | 'web' | null}
 */
export function normalizeFcmPlatform(raw) {
  if (typeof raw !== "string") return null;
  const p = raw.trim().toLowerCase();
  return FCM_PLATFORMS.has(p) ? /** @type {'ios' | 'android' | 'web'} */ (p) : null;
}

/**
 * Pure normalize for upsertPushToken.
 * @param {unknown} data
 * @returns {{
 *   ok: true;
 *   fcmToken: string | null;
 *   clear: boolean;
 *   fcmPlatform: 'ios' | 'android' | 'web' | null;
 * } | { ok: false; reason: string }}
 */
export function normalizeUpsertPushTokenRequest(data) {
  if (!data || typeof data !== "object") {
    return { ok: false, reason: "invalid-input" };
  }
  if (data.clear === true || data.fcmToken === null) {
    return { ok: true, fcmToken: null, clear: true, fcmPlatform: null };
  }
  if (!isValidFcmToken(data.fcmToken)) {
    return { ok: false, reason: "invalid-token" };
  }
  return {
    ok: true,
    fcmToken: String(data.fcmToken).trim(),
    clear: false,
    fcmPlatform: normalizeFcmPlatform(data.fcmPlatform ?? data.platform),
  };
}

/**
 * Pure normalize for setClubDispatchMute.
 * @param {unknown} data
 * @returns {{ ok: true; muteClubDispatches: boolean } | { ok: false; reason: string }}
 */
export function normalizeSetClubDispatchMuteRequest(data) {
  if (!data || typeof data !== "object") {
    return { ok: false, reason: "invalid-input" };
  }
  if (typeof data.muteClubDispatches !== "boolean") {
    // Accept mute alias
    if (typeof data.mute === "boolean") {
      return { ok: true, muteClubDispatches: data.mute };
    }
    return { ok: false, reason: "invalid-mute" };
  }
  return { ok: true, muteClubDispatches: data.muteClubDispatches };
}

/**
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 */
export async function runUpsertPushToken(request) {
  const uid = requireSignedInUid(request);
  const normalized = normalizeUpsertPushTokenRequest(request.data ?? {});
  if (!normalized.ok) {
    throw new HttpsError("invalid-argument", normalized.reason);
  }

  const nowIso = new Date().toISOString();
  /** @type {Record<string, unknown>} */
  const patch = {
    updatedAt: nowIso,
  };

  if (normalized.clear) {
    // WHY: delete > null — filterDispatchRecipients treats missing/invalid the same; keep doc clean.
    patch.fcmToken = FieldValue.delete();
    patch.fcmTokenUpdatedAt = nowIso;
    patch.fcmPlatform = FieldValue.delete();
    patch.apnsToken = FieldValue.delete();
  } else {
    let fcmToken = normalized.fcmToken;
    /** @type {string | null} */
    let apnsToken = null;

    // WHY: Capacitor iOS registers APNs hex; FCM Admin needs registration tokens.
    if (
      normalized.fcmPlatform === "ios" &&
      isApnsDeviceToken(normalized.fcmToken)
    ) {
      try {
        const resolved = await resolvePushCredentialToFcm({
          token: normalized.fcmToken,
          platform: "ios",
          application: IOS_BUNDLE_ID,
        });
        fcmToken = resolved.fcmToken;
        apnsToken = resolved.apnsToken;
        console.info("[upsertPushToken] APNs→FCM converted", {
          uid,
          sandbox: resolved.sandbox,
          apnsSuffix: apnsToken ? apnsToken.slice(-8) : null,
          fcmSuffix: fcmToken.length > 12 ? fcmToken.slice(-12) : null,
        });
      } catch (err) {
        console.error("[upsertPushToken] APNs→FCM failed", {
          uid,
          message: err?.message ?? String(err),
        });
        throw new HttpsError(
          "failed-precondition",
          "apns-to-fcm-failed",
          { message: err?.message ?? String(err) }
        );
      }
    }

    patch.fcmToken = fcmToken;
    patch.fcmTokenUpdatedAt = nowIso;
    if (normalized.fcmPlatform) {
      patch.fcmPlatform = normalized.fcmPlatform;
    }
    if (apnsToken) {
      patch.apnsToken = apnsToken;
    }
  }

  try {
    await db.collection("users").doc(uid).set(patch, { merge: true });
    return {
      ok: true,
      cleared: normalized.clear,
      fcmPlatform: normalized.fcmPlatform,
    };
  } catch (err) {
    rethrowGuildError(err, "[upsertPushToken] unexpected", "upsert-push-token-failed");
  }
}

/**
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 */
export async function runSetClubDispatchMute(request) {
  const uid = requireSignedInUid(request);
  const normalized = normalizeSetClubDispatchMuteRequest(request.data ?? {});
  if (!normalized.ok) {
    throw new HttpsError("invalid-argument", normalized.reason);
  }

  const nowIso = new Date().toISOString();
  try {
    await db.collection("users").doc(uid).set(
      {
        muteClubDispatches: normalized.muteClubDispatches,
        updatedAt: nowIso,
      },
      { merge: true }
    );
    return {
      ok: true,
      muteClubDispatches: normalized.muteClubDispatches,
    };
  } catch (err) {
    rethrowGuildError(err, "[setClubDispatchMute] unexpected", "set-club-dispatch-mute-failed");
  }
}

export const upsertPushToken = onCall(CALLABLE_OPTS, async (request) => {
  return runUpsertPushToken(request);
});

export const setClubDispatchMute = onCall(CALLABLE_OPTS, async (request) => {
  return runSetClubDispatchMute(request);
});
