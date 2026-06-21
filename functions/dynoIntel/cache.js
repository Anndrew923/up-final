import { createHash } from "node:crypto";
import {
  DYNO_INTEL_CACHE_COLLECTION,
  DYNO_INTEL_CACHE_TTL_MS,
} from "../shared/constants.js";
import { db } from "../shared/admin.js";
import { stableStringify } from "../shared/stableStringify.js";
import { isMethodologyReplyContext } from "./dynoIntelChassisFactory.js";
import { isMethodologyCommentaryComplete } from "./methodologyBeatRepair.js";

export function buildDynoIntelCacheHash(parts) {
  const payload = stableStringify(parts);
  return createHash("sha256").update(payload).digest("hex");
}

export async function loadDynoIntelCache(hash, nowMs = Date.now()) {
  const ref = db.collection(DYNO_INTEL_CACHE_COLLECTION).doc(hash);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  const expiresAtMs = new Date(data.expiresAt || 0).getTime();
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= nowMs) {
    return null;
  }
  return data.payload ?? null;
}

/**
 * WHY: Off-topic and truncated methodology replies must not be cached — they replay bad UX for 48h.
 * Stale truncated payloads already in cache are healed on read via finalizeDynoIntelCallableReply in chatCallable.
 */
export function shouldPersistDynoIntelCache(reply, context = null) {
  if (!reply || typeof reply !== "object") return false;
  if (reply.is_off_topic === true) return false;

  if (context && isMethodologyReplyContext(context)) {
    const locale = context.locale === "en" ? "en" : "zh-Hant";
    if (!isMethodologyCommentaryComplete(String(reply.commentary ?? "").trim(), locale)) {
      return false;
    }
  }

  return true;
}

export async function saveDynoIntelCache(hash, payload, promptTemplateId, now = new Date(), context = null) {
  if (!shouldPersistDynoIntelCache(payload, context)) {
    return false;
  }

  const expiresAt = new Date(now.getTime() + DYNO_INTEL_CACHE_TTL_MS).toISOString();
  await db.collection(DYNO_INTEL_CACHE_COLLECTION).doc(hash).set({
    payload,
    promptTemplateId,
    createdAt: now.toISOString(),
    expiresAt,
  });
  return true;
}
