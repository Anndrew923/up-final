import { onCall, HttpsError } from "firebase-functions/v2/https";
import { CALLABLE_OPTS } from "../shared/constants.js";
import { db } from "../shared/admin.js";
import {
  assertDynoIntelModeAllowed,
  assertDynoIntelTrialCoreOwned,
  resolveDynoIntelEntitlement,
} from "../shared/dynoEntitlement.js";
import { buildDynoIntelCacheHash, loadDynoIntelCache, saveDynoIntelCache } from "./cache.js";
import {
  buildCoachingBoundaryReply,
  buildGapsSeedReply,
  resolveDeterministicDynoIntelReply,
  shouldPreemptCoaching,
} from "./deterministicDynoIntelRoutes.js";
import { runGeminiDynoIntel, finalizeDynoIntelCallableReply } from "./gemini.js";
import { recordDynoIntelRouteTelemetry } from "./geminiTelemetry.js";
import { resolveHallOfFameConsultReply, isHallOfFameConsultQuestion } from "./hallOfFameConsultGate.js";
import { buildPreemptiveOffTopicReply, shouldPreemptOffTopic } from "./offTopicPreempt.js";
import {
  checkDynoIntelDailyLimit,
  loadDynoRateLimitDoc,
  recordDynoIntelUsage,
} from "./rateLimits.js";
import { buildDynoIntelInferenceContext } from "./pruneScoringMethodologyBriefs.js";
import { normalizeDynoIntelQuestion } from "./normalizeDynoIntelQuestion.js";
import { validateDynoIntelContext } from "./validateContext.js";

function isAnonymousProvider(request) {
  const provider = request.auth?.token?.firebase?.sign_in_provider;
  return provider === "anonymous" || !provider;
}

function buildDynoChatSuccess(quota, reply, { fromCache = false } = {}) {
  return {
    ok: true,
    fromCache,
    remaining: quota.remaining,
    limit: quota.limit,
    resetAt: quota.resetAt,
    reply,
  };
}

function isGeminiUnavailableError(err) {
  return (
    err?.code === "failed-precondition" ||
    String(err?.message ?? "").includes("gemini-not-configured")
  );
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
  const userQuestion = normalizeDynoIntelQuestion(
    typeof data.userQuestion === "string" ? data.userQuestion : ""
  );
  const promptTemplateId =
    typeof data.promptTemplateId === "string" && data.promptTemplateId
      ? data.promptTemplateId
      : "system_v1";

  const MAX_QUESTION_LENGTH = 500;

  /**
   * WHY: Logs are local-first on device — CF must not invent conversation memory.
   * Client attaches the newest dynoIntelLog turn so pantheon anaphora can inherit.
   */
  const priorTurnRaw = data.priorTurn;
  const priorFocusAxis =
    priorTurnRaw &&
    typeof priorTurnRaw === "object" &&
    typeof priorTurnRaw.focusAxis === "string"
      ? priorTurnRaw.focusAxis.trim().slice(0, 64)
      : "";
  const priorUserQuestion =
    priorTurnRaw &&
    typeof priorTurnRaw === "object" &&
    typeof priorTurnRaw.userQuestion === "string"
      ? normalizeDynoIntelQuestion(priorTurnRaw.userQuestion).slice(0, MAX_QUESTION_LENGTH)
      : "";
  const priorTurn =
    priorFocusAxis && priorUserQuestion
      ? { focusAxis: priorFocusAxis, userQuestion: priorUserQuestion }
      : null;

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
    overallScore: context.overallScore ?? null,
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
    priorFocusAxis: priorTurn?.focusAxis ?? null,
    priorUserQuestion: priorTurn?.userQuestion ?? null,
  });

  // WHY: Pantheon consult rosters are Fisher–Yates sampled — replaying a cached
  // commentary freezes the same 3 names across identical questions.
  const isHallConsult = isHallOfFameConsultQuestion(userQuestion);
  const cached = isHallConsult ? null : await loadDynoIntelCache(cacheHash);
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
    recordDynoIntelRouteTelemetry({ route: "firestore-cache", uid, userQuestion });
    return buildDynoChatSuccess(
      quota,
      finalizeDynoIntelCallableReply(cached, inferenceContext, userQuestion),
      { fromCache: true }
    );
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

  const hasGaps = Array.isArray(inferenceContext.gaps) && inferenceContext.gaps.length > 0;
  if (hasGaps) {
    const reply = finalizeDynoIntelCallableReply(
      buildGapsSeedReply(inferenceContext),
      inferenceContext,
      userQuestion
    );
    await saveDynoIntelCache(cacheHash, reply, promptTemplateId, now, inferenceContext);
    recordDynoIntelRouteTelemetry({ route: "gaps-deterministic", uid, userQuestion });
    return buildDynoChatSuccess(quota, reply);
  }

  if (shouldPreemptCoaching(userQuestion, inferenceContext)) {
    const reply = finalizeDynoIntelCallableReply(
      buildCoachingBoundaryReply(inferenceContext),
      inferenceContext,
      userQuestion
    );
    recordDynoIntelRouteTelemetry({ route: "coaching-deterministic", uid, userQuestion });
    return buildDynoChatSuccess(quota, reply);
  }

  if (shouldPreemptOffTopic(userQuestion, inferenceContext)) {
    const reply = finalizeDynoIntelCallableReply(
      buildPreemptiveOffTopicReply(userQuestion, inferenceContext),
      inferenceContext,
      userQuestion
    );
    recordDynoIntelRouteTelemetry({ route: "off-topic-preempt", uid, userQuestion });
    return buildDynoChatSuccess(quota, reply);
  }

  const hallOfFameConsultReply = resolveHallOfFameConsultReply(
    inferenceContext,
    userQuestion,
    priorTurn
  );
  if (hallOfFameConsultReply) {
    const reply = finalizeDynoIntelCallableReply(
      hallOfFameConsultReply,
      inferenceContext,
      userQuestion
    );
    // WHY: Never persist shuffled pantheon consult copy — each ask must re-sample.
    recordDynoIntelRouteTelemetry({ route: "hall-of-fame", uid, userQuestion });
    return buildDynoChatSuccess(quota, reply);
  }

  let reply;
  let inferenceRoute = "gemini";
  try {
    const geminiResult = await runGeminiDynoIntel({
      context: inferenceContext,
      userQuestion,
      promptTemplateId,
    });
    reply = geminiResult.reply;
    inferenceRoute = geminiResult.inferenceRoute;
  } catch (err) {
    if (isGeminiUnavailableError(err)) {
      const fallbackSeed = resolveDeterministicDynoIntelReply(inferenceContext, userQuestion);
      if (fallbackSeed) {
        reply = finalizeDynoIntelCallableReply(fallbackSeed, inferenceContext, userQuestion);
        inferenceRoute = "deterministic-fallback";
        recordDynoIntelRouteTelemetry({
          route: inferenceRoute,
          uid,
          userQuestion,
          fallbackReason: String(err?.message ?? "unknown"),
        });
        await saveDynoIntelCache(cacheHash, reply, promptTemplateId, now, inferenceContext);
        return buildDynoChatSuccess(quota, reply);
      }
    }

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

  recordDynoIntelRouteTelemetry({ route: inferenceRoute, uid, userQuestion });
  await saveDynoIntelCache(cacheHash, reply, promptTemplateId, now, inferenceContext);
  return buildDynoChatSuccess(quota, reply);
});
