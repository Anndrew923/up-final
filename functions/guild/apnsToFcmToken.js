/**
 * Convert iOS APNs device tokens → FCM registration tokens via IID batchImport.
 *
 * WHY: Capacitor PushNotifications on iOS yields 64-hex APNs tokens; Admin
 * messaging.send / sendEachForMulticast require FCM registration tokens.
 * Cloud-side conversion avoids shipping a new native Messaging plugin.
 *
 * Note: Instance ID batchImport is scheduled for removal 2027-09-29 — migrate
 * to Firebase Messaging client registration before then.
 */
import { GoogleAuth } from "google-auth-library";

export const IOS_BUNDLE_ID = "com.ultimatephysique.fitness2025";
export const IID_BATCH_IMPORT_URL = "https://iid.googleapis.com/iid/v1:batchImport";
const CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

/** @type {GoogleAuth | null} */
let authClient = null;

/**
 * Capacitor iOS registration value is typically a 64-char hex APNs device token.
 * @param {unknown} raw
 * @returns {boolean}
 */
export function isApnsDeviceToken(raw) {
  return typeof raw === "string" && /^[0-9a-fA-F]{64}$/.test(raw.trim());
}

/**
 * @returns {Promise<string>}
 */
async function getCloudPlatformAccessToken() {
  if (!authClient) {
    authClient = new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] });
  }
  const client = await authClient.getClient();
  const tokenResponse = await client.getAccessToken();
  const token =
    typeof tokenResponse === "string"
      ? tokenResponse
      : tokenResponse && typeof tokenResponse.token === "string"
        ? tokenResponse.token
        : "";
  if (!token) {
    throw new Error("apns-to-fcm: failed to obtain OAuth2 access token");
  }
  return token;
}

/**
 * Single batchImport attempt for one APNs token.
 * @param {{
 *   apnsToken: string;
 *   application?: string;
 *   sandbox: boolean;
 *   accessToken: string;
 * }} input
 * @returns {Promise<string>}
 */
export async function batchImportApnsToken(input) {
  const apnsToken = String(input.apnsToken || "").trim();
  if (!isApnsDeviceToken(apnsToken)) {
    throw new Error("apns-to-fcm: invalid APNs device token (expected 64 hex)");
  }
  const application =
    typeof input.application === "string" && input.application.trim()
      ? input.application.trim()
      : IOS_BUNDLE_ID;

  const response = await fetch(IID_BATCH_IMPORT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
      access_token_auth: "true",
    },
    body: JSON.stringify({
      application,
      sandbox: input.sandbox === true,
      apns_tokens: [apnsToken],
    }),
  });

  const text = await response.text();
  /** @type {unknown} */
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    const errMsg =
      body && typeof body === "object" && body !== null && "error" in body
        ? String(/** @type {{ error?: unknown }} */ (body).error)
        : text.slice(0, 200);
    throw new Error(
      `apns-to-fcm: batchImport HTTP ${response.status} (sandbox=${input.sandbox}): ${errMsg}`
    );
  }

  const results =
    body && typeof body === "object" && body !== null && "results" in body
      ? /** @type {{ results?: unknown }} */ (body).results
      : null;
  const first = Array.isArray(results) ? results[0] : null;
  if (!first || typeof first !== "object") {
    throw new Error(
      `apns-to-fcm: batchImport empty results (sandbox=${input.sandbox})`
    );
  }

  const status =
    "status" in first ? String(/** @type {{ status?: unknown }} */ (first).status) : "";
  const registrationToken =
    "registration_token" in first
      ? String(/** @type {{ registration_token?: unknown }} */ (first).registration_token || "")
      : "";

  if (status !== "OK" || !registrationToken) {
    throw new Error(
      `apns-to-fcm: batchImport status=${status || "unknown"} (sandbox=${input.sandbox})`
    );
  }

  return registrationToken;
}

/**
 * Prefer sandbox (Xcode Debug), then production APNs environment.
 * @param {{
 *   apnsToken: string;
 *   application?: string;
 * }} input
 * @returns {Promise<{ fcmToken: string; sandbox: boolean; apnsToken: string }>}
 */
export async function convertApnsTokenToFcm(input) {
  const apnsToken = String(input.apnsToken || "").trim();
  if (!isApnsDeviceToken(apnsToken)) {
    throw new Error("apns-to-fcm: invalid APNs device token (expected 64 hex)");
  }

  const accessToken = await getCloudPlatformAccessToken();
  const application = input.application;

  /** @type {Error | null} */
  let lastError = null;
  for (const sandbox of [true, false]) {
    try {
      const fcmToken = await batchImportApnsToken({
        apnsToken,
        application,
        sandbox,
        accessToken,
      });
      return { fcmToken, sandbox, apnsToken };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error("apns-to-fcm: batchImport failed for both sandbox and production");
}

/**
 * Resolve a push credential into an FCM registration token.
 * Non-APNs values pass through unchanged.
 * @param {{
 *   token: string;
 *   platform?: string | null;
 *   application?: string;
 * }} input
 * @returns {Promise<{
 *   fcmToken: string;
 *   apnsToken: string | null;
 *   converted: boolean;
 *   sandbox: boolean | null;
 * }>}
 */
export async function resolvePushCredentialToFcm(input) {
  const token = String(input.token || "").trim();
  const platform =
    typeof input.platform === "string" ? input.platform.trim().toLowerCase() : "";

  if (!token) {
    throw new Error("apns-to-fcm: empty token");
  }

  // WHY: Capacitor iOS always yields 64-hex; require ios (or unset when script omits platform).
  const shouldConvert =
    isApnsDeviceToken(token) && (platform === "ios" || platform.length === 0);

  if (!shouldConvert) {
    return {
      fcmToken: token,
      apnsToken: null,
      converted: false,
      sandbox: null,
    };
  }

  const converted = await convertApnsTokenToFcm({
    apnsToken: token,
    application: input.application,
  });
  return {
    fcmToken: converted.fcmToken,
    apnsToken: converted.apnsToken,
    converted: true,
    sandbox: converted.sandbox,
  };
}
