import { onCall, HttpsError } from "firebase-functions/v2/https";
import { CALLABLE_OPTS } from "../shared/constants.js";
import { db } from "../shared/admin.js";
import {
  assertDynoIntelModeAllowed,
  assertDynoIntelTrialCoreOwned,
  resolveDynoIntelEntitlement,
} from "../shared/dynoEntitlement.js";
import { buildDynoIntelCacheHash, loadDynoIntelCache, saveDynoIntelCache } from "./cache.js";
import { runGeminiDynoIntel } from "./gemini.js";
import { enforceCommentaryBeatContract } from "./commentaryBeatContract.js";
import {
  checkDynoIntelDailyLimit,
  loadDynoRateLimitDoc,
  recordDynoIntelUsage,
} from "./rateLimits.js";
import { buildDynoIntelInferenceContext } from "./pruneScoringMethodologyBriefs.js";
import { validateDynoIntelContext } from "./validateContext.js";

function isAnonymousProvider(request) {
  const provider = request.auth?.token?.firebase?.sign_in_provider;
  return provider === "anonymous" || !provider;
}

async function consumeDynoQuota(uid, isPro, now) {
  return db.runTransaction(async (tx) => {
    const { ref, data } = await loadDynoRateLimitDoc(uid, tx);
    const rateCheck = checkDynoIntelDailyLimit(data, isPro, now);
    if (!rateCheck.allowed) {
      return {
        allowed: false,
        remaining: 0,
        limit: rateCheck.limit,
        resetAt: rateCheck.resetAt,
      };
    }
    const usage = recordDynoIntelUsage(rateCheck.bucket, isPro, now);
    tx.set(ref, {
      dayKey: usage.dayKey,
      countToday: usage.countToday,
      limit: usage.limit,
    });
    return {
      allowed: true,
      remaining: usage.remaining,
      limit: usage.limit,
      resetAt: usage.resetAt,
    };
  });
}

export const dynoIntelChat = onCall(CALLABLE_OPTS, async (request) => {
  const uid = request.auth?.uid;
  if (!uid || isAnonymousProvider(request)) {
    throw new HttpsError("unauthenticated", "Google sign-in required");
  }

  const data = request.data ?? {};
  const context = data.context;
  const userQuestion = typeof data.userQuestion === "string" ? data.userQuestion.trim() : "";
  const promptTemplateId =
    typeof data.promptTemplateId === "string" && data.promptTemplateId
      ? data.promptTemplateId
      : "system_v1";

  const MAX_QUESTION_LENGTH = 500;
  if (!userQuestion) {
    throw new HttpsError("invalid-argument", "userQuestion is required");
  }
  if (userQuestion.length > MAX_QUESTION_LENGTH) {
    throw new HttpsError("invalid-argument", "userQuestion too long");
  }

  try {
    validateDynoIntelContext(context);
  } catch (err) {
    throw new HttpsError("invalid-argument", err?.message ?? "invalid-context");
  }

  const mode = context.mode;
  const now = new Date();
  const { isPro, hasCore } = await resolveDynoIntelEntitlement(uid, request.auth?.token, now);

  try {
    assertDynoIntelTrialCoreOwned(mode, isPro, hasCore);
    assertDynoIntelModeAllowed(mode, isPro);
  } catch (err) {
    if (err?.code === "pro-required") {
      return { ok: false, reason: "pro-required" };
    }
    if (err?.code === "core-required") {
      return { ok: false, reason: "core-required" };
    }
    throw err;
  }

  const inferenceContext = buildDynoIntelInferenceContext(context, userQuestion);

  const cacheHash = buildDynoIntelCacheHash({
    mergedScores: context.axes,
    supplementalMetrics: context.supplementalMetrics ?? [],
    scoringMethodologyBriefs: inferenceContext.scoringMethodologyBriefs ?? [],
    intent: inferenceContext.intent,
    assessmentDeepDiveNudge: context.assessmentDeepDiveNudge ?? null,
    replyClosingCue: context.replyClosingCue ?? null,
    closingBeatKind: context.closingBeatKind ?? null,
    closingBeatSecondLine: context.closingBeatSecondLine ?? null,
    questionFocusAxis: context.questionFocusAxis ?? null,
    focusSupplemental: context.focusSupplemental ?? null,
    deltas: context.momentum?.deltas ?? [],
    mode: context.mode,
    focusAxis: context.focusAxis ?? null,
    locale: context.locale,
    weightSimulationTargetKg: context.weightSimulation?.targetWeightKg ?? null,
    promptTemplateId,
    userQuestion,
  });

  const cached = await loadDynoIntelCache(cacheHash);
  if (cached) {
    const quota = await consumeDynoQuota(uid, isPro, now);
    if (!quota.allowed) {
      return {
        ok: false,
        reason: "quota-exhausted",
        remaining: 0,
        limit: quota.limit,
        resetAt: quota.resetAt,
      };
    }
    return {
      ok: true,
      fromCache: true,
      remaining: quota.remaining,
      limit: quota.limit,
      resetAt: quota.resetAt,
      reply: enforceCommentaryBeatContract(cached, inferenceContext),
    };
  }

  const quota = await consumeDynoQuota(uid, isPro, now);
  if (!quota.allowed) {
    return {
      ok: false,
      reason: "quota-exhausted",
      remaining: 0,
      limit: quota.limit,
      resetAt: quota.resetAt,
    };
  }

  let reply;
  try {
    reply = await runGeminiDynoIntel({
      context: inferenceContext,
      userQuestion,
      promptTemplateId,
    });
  } catch (err) {
    if (err?.code === "failed-precondition") {
      throw new HttpsError("failed-precondition", "Gemini API is not configured");
    }
    if (String(err?.message ?? "").includes("gemini-http-429")) {
      throw new HttpsError("resource-exhausted", "Gemini API quota exhausted");
    }
    if (String(err?.message ?? "").includes("gemini-invalid-json")) {
      throw new HttpsError("internal", "DYNO_INTEL_INFERENCE_MALFORMED");
    }
    console.error("[dynoIntelChat] gemini failure", err?.message, err?.detail ?? "");
    throw new HttpsError("internal", "DYNO INTEL inference failed");
  }

  await saveDynoIntelCache(cacheHash, reply, promptTemplateId, now);

  return {
    ok: true,
    fromCache: false,
    remaining: quota.remaining,
    limit: quota.limit,
    resetAt: quota.resetAt,
    reply,
  };
});
