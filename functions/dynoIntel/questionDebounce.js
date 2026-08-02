import { createHash } from "node:crypto";
import {
  DYNO_INTEL_QUESTION_DEBOUNCE_MS,
  DYNO_INTEL_RATE_LIMITS_COLLECTION,
} from "../shared/constants.js";
import { db } from "../shared/admin.js";

export { DYNO_INTEL_QUESTION_DEBOUNCE_MS };

export function buildDynoQuestionFingerprint(userQuestion) {
  return createHash("sha256").update(String(userQuestion ?? "").trim()).digest("hex").slice(0, 32);
}

/**
 * @returns {Promise<{ debounced: boolean, fingerprint: string }>}
 */
export async function checkAndTouchDynoQuestionDebounce(uid, userQuestion, now = new Date()) {
  const fingerprint = buildDynoQuestionFingerprint(userQuestion);
  const nowMs = now.getTime();
  const ref = db.collection(DYNO_INTEL_RATE_LIMITS_COLLECTION).doc(uid);

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() || {};
    const lastFingerprint =
      typeof data.lastQuestionFingerprint === "string" ? data.lastQuestionFingerprint : "";
    const lastAtMs = Number(data.lastQuestionAtMs) || 0;

    if (
      lastFingerprint === fingerprint &&
      Number.isFinite(lastAtMs) &&
      nowMs - lastAtMs < DYNO_INTEL_QUESTION_DEBOUNCE_MS
    ) {
      return { debounced: true, fingerprint };
    }

    tx.set(
      ref,
      {
        lastQuestionFingerprint: fingerprint,
        lastQuestionAtMs: nowMs,
      },
      { merge: true }
    );
    return { debounced: false, fingerprint };
  });

  return result;
}
