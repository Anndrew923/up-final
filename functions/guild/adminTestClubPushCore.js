/**
 * Shared admin smoke: resolve stored push credential → FCM → send 【戰隊快報】 → persist.
 * Used by private HTTP invoker; keeps script thin (cloud-only).
 */
import { db, messaging } from "../shared/admin.js";
import {
  IOS_BUNDLE_ID,
  isApnsDeviceToken,
  resolvePushCredentialToFcm,
} from "./apnsToFcmToken.js";

const TEST_NOTIFICATION = {
  title: "【戰隊快報 // 測試廣播】",
  body: "隊友打破了個人極限！推播端對端驗收中。",
};

/**
 * Prefer a usable FCM registration token; else fall back to APNs hex for conversion.
 * @param {Record<string, unknown>} data
 * @returns {string}
 */
export function pickStoredPushCredential(data) {
  const fcm = typeof data.fcmToken === "string" ? data.fcmToken.trim() : "";
  const apns = typeof data.apnsToken === "string" ? data.apnsToken.trim() : "";
  // WHY: After a prior convert, fcmToken is FCM — do not treat as APNs; skip IID round-trip.
  if (fcm && !isApnsDeviceToken(fcm)) return fcm;
  if (isApnsDeviceToken(fcm)) return fcm;
  if (isApnsDeviceToken(apns)) return apns;
  return fcm || apns;
}

/**
 * @param {string} targetUid
 * @returns {Promise<{
 *   ok: true;
 *   targetUid: string;
 *   messageId: string;
 *   converted: boolean;
 *   sandbox: boolean | null;
 *   fcmTokenSuffix: string;
 *   apnsTokenSuffix: string | null;
 * }>}
 */
export async function runAdminTestClubDispatchPush(targetUid) {
  const uid = typeof targetUid === "string" ? targetUid.trim() : "";
  if (!uid) {
    const err = new Error("target-uid-required");
    err.code = "invalid-argument";
    throw err;
  }

  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) {
    const err = new Error("user-not-found");
    err.code = "not-found";
    throw err;
  }

  const data = snap.data() || {};
  const raw = pickStoredPushCredential(data);
  if (!raw) {
    const err = new Error("no-push-credential");
    err.code = "failed-precondition";
    throw err;
  }

  const resolved = await resolvePushCredentialToFcm({
    token: raw,
    platform: "ios",
    application: IOS_BUNDLE_ID,
  });

  const messageId = await messaging.send({
    token: resolved.fcmToken,
    notification: TEST_NOTIFICATION,
    data: {
      type: "club_progress_dispatch",
      route: "/crew",
      source: "admin-smoke",
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
          badge: 1,
        },
      },
    },
  });

  const nowIso = new Date().toISOString();
  /** @type {Record<string, unknown>} */
  const patch = {
    fcmToken: resolved.fcmToken,
    fcmTokenUpdatedAt: nowIso,
    fcmPlatform: "ios",
    updatedAt: nowIso,
  };
  if (resolved.apnsToken) {
    patch.apnsToken = resolved.apnsToken;
  } else if (isApnsDeviceToken(raw)) {
    patch.apnsToken = raw;
  }

  await db.collection("users").doc(uid).set(patch, { merge: true });

  return {
    ok: true,
    targetUid: uid,
    messageId,
    converted: resolved.converted,
    sandbox: resolved.sandbox,
    fcmTokenSuffix:
      resolved.fcmToken.length > 12 ? resolved.fcmToken.slice(-12) : resolved.fcmToken,
    apnsTokenSuffix: resolved.apnsToken
      ? resolved.apnsToken.slice(-8)
      : isApnsDeviceToken(raw)
        ? raw.slice(-8)
        : null,
  };
}
