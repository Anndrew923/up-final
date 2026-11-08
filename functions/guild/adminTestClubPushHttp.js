/**
 * Admin smoke HTTP: APNs→FCM (runtime SA) + send 【戰隊快報】 test push.
 * WHY: Local user ADC cannot authorize iid.googleapis.com batchImport (401);
 * Cloud Functions default SA can. Invoke with Google ID token (invoker: private).
 *
 * POST JSON: { "targetUid": "<required>" }
 */
import { onRequest } from "firebase-functions/v2/https";
import { CALLABLE_OPTS } from "../shared/constants.js";
import { runAdminTestClubDispatchPush } from "./adminTestClubPushCore.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function handleAdminSendTestClubDispatchPush(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method-not-allowed" });
    return;
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const targetUid =
    typeof body.targetUid === "string" && body.targetUid.trim()
      ? body.targetUid.trim()
      : "";

  if (!targetUid) {
    res.status(400).json({ ok: false, error: "target-uid-required" });
    return;
  }

  try {
    const result = await runAdminTestClubDispatchPush(targetUid);
    console.info("[adminSendTestClubDispatchPush] OK", {
      targetUid: result.targetUid,
      messageId: result.messageId,
      converted: result.converted,
      sandbox: result.sandbox,
    });
    res.status(200).json(result);
  } catch (err) {
    const code = err?.code ?? null;
    const message = err?.message ?? String(err);
    console.error("[adminSendTestClubDispatchPush] failed", { message, code });
    const status =
      code === "not-found"
        ? 404
        : code === "invalid-argument" || code === "failed-precondition"
          ? 400
          : 500;
    res.status(status).json({ ok: false, error: message, code });
  }
}

export const adminSendTestClubDispatchPush = onRequest(
  {
    region: CALLABLE_OPTS.region,
    memory: CALLABLE_OPTS.memory,
    timeoutSeconds: 120,
    // WHY: IAM-authenticated only — local ADC ID token; runtime SA performs IID+FCM.
    invoker: "private",
  },
  handleAdminSendTestClubDispatchPush
);
