/**
 * Admin smoke: invoke deployed adminSendTestClubDispatchPush (runtime SA).
 *
 * WHY: Local user ADC cannot call iid.googleapis.com batchImport (401).
 * Conversion + FCM send run in Cloud; this script only supplies an ID token.
 *
 * Usage:
 *   GOOGLE_CLOUD_PROJECT=fitness-app-69f08 node scripts/sendTestClubDispatchPush.js <uid>
 *   TEST_PUSH_URL=https://...run.app node scripts/sendTestClubDispatchPush.js <uid>
 */
import { GoogleAuth } from "google-auth-library";

const TARGET_UID = (process.argv[2] || "").trim();
const DEFAULT_HTTP_URL =
  process.env.TEST_PUSH_URL ||
  "https://us-central1-fitness-app-69f08.cloudfunctions.net/adminSendTestClubDispatchPush";

if (!TARGET_UID) {
  console.error(
    "Usage: GOOGLE_CLOUD_PROJECT=fitness-app-69f08 node scripts/sendTestClubDispatchPush.js <uid>"
  );
  process.exit(1);
}

/**
 * @param {string} url
 * @param {string} targetUid
 */
async function invokeCloudSmoke(url, targetUid) {
  const auth = new GoogleAuth();
  const client = await auth.getIdTokenClient(url);
  const res = await client.request({
    url,
    method: "POST",
    data: { targetUid },
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
}

console.info("[sendTestClubDispatchPush] invoking Cloud smoke", {
  uid: TARGET_UID,
  url: DEFAULT_HTTP_URL,
});

try {
  const result = await invokeCloudSmoke(DEFAULT_HTTP_URL, TARGET_UID);
  console.info("[sendTestClubDispatchPush] cloud result", result);
  if (!result?.ok) {
    process.exit(1);
  }
  console.info("[sendTestClubDispatchPush] sent OK", {
    messageId: result.messageId,
    converted: result.converted,
    sandbox: result.sandbox,
    fcmTokenSuffix: result.fcmTokenSuffix,
    apnsTokenSuffix: result.apnsTokenSuffix,
  });
} catch (err) {
  console.error("[sendTestClubDispatchPush] cloud invoke failed", {
    message: err?.message ?? String(err),
    status: err?.response?.status ?? null,
    data: err?.response?.data ?? null,
  });
  process.exit(1);
}
