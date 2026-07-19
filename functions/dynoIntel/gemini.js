import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DYNO_INTEL_GEMINI_MAX_OUTPUT_TOKENS } from "../shared/constants.js";
import {
  enforceCommentaryBeatContract,
} from "./commentaryBeatContract.js";
import { buildGeminiInferencePayload } from "./buildGeminiInferencePayload.js";
import { resolveDeterministicDynoIntelReply } from "./deterministicDynoIntelRoutes.js";
import { enforceOnTopicRail } from "./enforceOnTopicRail.js";
import {
  readLastGeminiUsageMetadata,
  recordDynoIntelGeminiTelemetry,
  resolveGeminiTelemetryRoute,
} from "./geminiTelemetry.js";
import {
  invalidateGeminiContextCache,
  resolveGeminiContextCache,
} from "./geminiContextCache.js";
import { resolveDynoIntelGeminiModel, resolveDynoIntelRoutingIntent } from "./resolveGeminiModel.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    commentary: { type: "string" },
    action_directive: { type: "string" },
    is_off_topic: { type: "boolean" },
    detected_weakest_axis: { type: "string" },
  },
  required: ["commentary", "action_directive", "is_off_topic", "detected_weakest_axis"],
};

let cachedSystemPromptZh = null;
let cachedSystemPromptEn = null;

/**
 * WHY: Locale-specific prompt files — avoids single mega-prompt with mixed-language instructions.
 */
export function resolveDynoIntelPromptFile(promptTemplateId = "system_v1", locale = "zh-Hant") {
  if (promptTemplateId !== "system_v1") return promptTemplateId;
  return locale === "en" ? "system_v1_en" : "system_v1";
}

function loadSystemPrompt(promptTemplateId = "system_v1", locale = "zh-Hant") {
  const fileId = resolveDynoIntelPromptFile(promptTemplateId, locale);
  if (fileId === "system_v1" && cachedSystemPromptZh) {
    return cachedSystemPromptZh;
  }
  if (fileId === "system_v1_en" && cachedSystemPromptEn) {
    return cachedSystemPromptEn;
  }
  const filePath = join(__dirname, "prompts", `${fileId}.txt`);
  let text;
  try {
    text = readFileSync(filePath, "utf8");
  } catch {
    const err = new Error(`prompt-not-found:${fileId}`);
    err.code = "failed-precondition";
    throw err;
  }
  if (fileId === "system_v1") {
    cachedSystemPromptZh = text;
  } else if (fileId === "system_v1_en") {
    cachedSystemPromptEn = text;
  }
  return text;
}

function resolveReplyLocale(context) {
  return context?.locale === "en" ? "en" : "zh-Hant";
}

/** WHY: Sanitizers must not flatten model `\n\n` paragraph breaks mandated by READABILITY. */
function preserveParagraphBreaks(text) {
  return String(text ?? "")
    .split(/\n\n+/)
    .map((paragraph) => paragraph.replace(/[^\S\n]+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}

function requireGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error("gemini-not-configured");
    err.code = "failed-precondition";
    throw err;
  }
  return apiKey;
}

/**
 * Gemini occasionally wraps JSON in fences or prefixes prose despite responseSchema.
 * Design intent (WHY): avoid surfacing intermittent parse flakes as user-facing 500s.
 */
export function salvagePartialGeminiReply(text, locale = "zh-Hant", context = null) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed.startsWith("{")) return null;

  const commentaryMatch =
    trimmed.match(/"commentary"\s*:\s*"((?:[^"\\]|\\.)*)"/) ??
    trimmed.match(/"commentary"\s*:\s*"([\s\S]+)/);
  if (!commentaryMatch?.[1]) return null;

  const actionMatch = trimmed.match(/"action_directive"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  const axisMatch = trimmed.match(/"detected_weakest_axis"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  const offTopicMatch = trimmed.match(/"is_off_topic"\s*:\s*(true|false)/);

  return normalizeGeminiReply(
    {
      commentary: unescapeJsonString(commentaryMatch[1]),
      action_directive: actionMatch?.[1] ? unescapeJsonString(actionMatch[1]) : "",
      is_off_topic: offTopicMatch?.[1] === "true",
      detected_weakest_axis: axisMatch?.[1] ? unescapeJsonString(axisMatch[1]) : "",
    },
    locale,
    context,
    context?.userQuestion ?? ""
  );
}

function unescapeJsonString(value) {
  return String(value)
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

export function parseGeminiStructuredJson(text) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1].trim());
      } catch {
        /* fall through */
      }
    }

    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
  }

  return null;
}

function extractGeminiTextPayload(json) {
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  const combined = parts
    .map((part) => part?.text)
    .filter((value) => typeof value === "string" && value.length > 0)
    .join("");
  return combined || null;
}

function normalizeGeminiReply(parsed, locale = "zh-Hant", context = null, userQuestion = "") {
  const base = {
    commentary: String(parsed.commentary ?? ""),
    action_directive: String(parsed.action_directive ?? ""),
    is_off_topic: Boolean(parsed.is_off_topic),
    detected_weakest_axis: String(parsed.detected_weakest_axis ?? ""),
  };
  return finalizeDynoIntelCallableReply(base, context, userQuestion, locale);
}

/** Post-model pipeline: sanitize → on-topic rail → beat contract. */
export function finalizeDynoIntelCallableReply(reply, context, userQuestion = "", locale = null) {
  const resolvedLocale = locale ?? resolveReplyLocale(context);
  const finalized = finalizeDynoIntelReply(reply, resolvedLocale);
  const railed = enforceOnTopicRail(finalized, context, userQuestion);
  const repaired = enforceCommentaryBeatContract(railed, context);
  const clientReply = { ...repaired };
  delete clientReply.hallOfFameConsultReply;
  return {
    ...clientReply,
    commentary: stripTechnicalLeakage(clientReply.commentary, resolvedLocale).trim(),
  };
}

/** WHY: Model may leak internal persona names despite prompt blacklist — strip before client render. */
const PERSONA_LEAKAGE_PATTERNS = [
  /Bruno/gi,
  /Bruce/gi,
  /布魯斯/g,
  /叔叔/g,
  /大肚魚/g,
  /總監/g,
  /\bPrompt\b/gi,
  /開發者/g,
];

export function stripPersonaLeakage(text) {
  let result = String(text ?? "");
  for (const pattern of PERSONA_LEAKAGE_PATTERNS) {
    result = result.replace(pattern, "");
  }
  return preserveParagraphBreaks(
    result.replace(/^[：:,\s]+|[：:,\s]+$/g, "").trim()
  );
}

/** WHY: Prompt uses internal JSON keys — replace with locale-aware product language. */
const TECHNICAL_LEAKAGE_REPLACEMENTS_ZH = [
  [/cardCopy/gi, "級距解碼"],
  [/cardcopy/gi, "級距解碼"],
  [/tierBandId/gi, "級距"],
  [/telemetryKey/gi, "遙測軸"],
  [/weakestAxis/gi, "最弱軸線"],
  [/assessmentRoute/gi, "測驗頁"],
  [/focusAxisLexicon/gi, "聚焦軸"],
  [/weightSimulation/gi, "體重模擬"],
  [/\bJSON\b/gi, "遙測數據"],
  [/\bschema\b/gi, "規格"],
  [/scoreMeaning/gi, "級距解碼"],
  [/supplementalMetrics/gi, "補充遙測"],
  [/focusSupplemental/gi, "補充聚焦"],
  [/scoringMethodologyBriefs/gi, "給分標準說明"],
  [/assessmentDeepDiveNudge/gi, "評測頁深度說明"],
  [/replyClosingCue/gi, "通電收束"],
  [/closingBeatKind/gi, "收束模式"],
  [/closingBeatSecondLine/gi, "收束尾韻"],
  [/questionFocusAxis/gi, "問題焦點軸"],
  [/資料鏈路/g, "服務範圍"],
  [/\(\s*(strength|cardio|bodyFat|muscleMass|explosivePower|gripStrength)\s*(軸分數|axis\s*score)?\s*\)/gi, ""],
  [/\(\s*(strength|cardio|bodyFat|muscleMass|explosivePower|gripStrength)\s*\)/gi, ""],
  [
    /\b(strength|cardio|bodyFat|muscleMass|explosivePower|gripStrength)\s*軸分數\b/gi,
    "軸分數",
  ],
];

const TECHNICAL_LEAKAGE_REPLACEMENTS_EN = [
  [/cardCopy/gi, "tier decode"],
  [/cardcopy/gi, "tier decode"],
  [/tierBandId/gi, "tier"],
  [/telemetryKey/gi, "telemetry axis"],
  [/weakestAxis/gi, "weakest axis"],
  [/assessmentRoute/gi, "assessment page"],
  [/focusAxisLexicon/gi, "focus axis"],
  [/weightSimulation/gi, "weight simulation"],
  [/\bJSON\b/gi, "telemetry data"],
  [/\bschema\b/gi, "spec"],
  [/scoreMeaning/gi, "tier decode"],
  [/supplementalMetrics/gi, "supplemental telemetry"],
  [/focusSupplemental/gi, "supplemental focus"],
  [/scoringMethodologyBriefs/gi, "scoring methodology briefs"],
  [/assessmentDeepDiveNudge/gi, "assessment page deep dive"],
  [/replyClosingCue/gi, "uplink close cue"],
  [/closingBeatKind/gi, "close beat mode"],
  [/closingBeatSecondLine/gi, "close beat second line"],
  [/questionFocusAxis/gi, "question focus axis"],
  [
    /\(\s*(strength|cardio|bodyFat|muscleMass|explosivePower|gripStrength)\s*(axis\s*score)?\s*\)/gi,
    "",
  ],
  [/\(\s*(strength|cardio|bodyFat|muscleMass|explosivePower|gripStrength)\s*\)/gi, ""],
  [
    /\b(strength|cardio|bodyFat|muscleMass|explosivePower|gripStrength)\s*axis\s*score\b/gi,
    "axis score",
  ],
];

export function stripTechnicalLeakage(text, locale = "zh-Hant") {
  const replacements =
    locale === "en" ? TECHNICAL_LEAKAGE_REPLACEMENTS_EN : TECHNICAL_LEAKAGE_REPLACEMENTS_ZH;
  let result = String(text ?? "");
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  return preserveParagraphBreaks(result);
}

function sanitizeUserFacingText(text, locale = "zh-Hant") {
  return stripTechnicalLeakage(stripPersonaLeakage(text), locale);
}

/** WHY: action_directive is retired from product UI — always empty before client/cache. */
function enforceEmptyActionDirective(reply) {
  if (!reply || typeof reply !== "object") return reply;
  return { ...reply, action_directive: "" };
}

/** WHY: Off-topic contract requires empty action_directive — enforce even if model disobeys. */
export function enforceOffTopicContract(reply) {
  if (!reply?.is_off_topic) return enforceEmptyActionDirective(reply);
  return enforceEmptyActionDirective({
    ...reply,
    action_directive: "",
  });
}

export function finalizeDynoIntelReply(reply, locale = "zh-Hant") {
  const sanitized = {
    ...reply,
    commentary: sanitizeUserFacingText(reply.commentary, locale),
    action_directive: "",
  };
  return enforceOffTopicContract(sanitized);
}

/** Back-compat export — delegates to per-request telemetry snapshot. */
export function getLastGeminiUsageMetadata() {
  return readLastGeminiUsageMetadata();
}

async function invokeGeminiOnce({
  apiKey,
  model,
  systemInstruction,
  context,
  userQuestion,
  promptTemplateId,
  cachedContentName = null,
}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: JSON.stringify({
              context,
              userQuestion,
              promptTemplateId,
            }),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.55,
      maxOutputTokens: DYNO_INTEL_GEMINI_MAX_OUTPUT_TOKENS,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  if (cachedContentName) {
    body.cachedContent = cachedContentName;
  } else {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    const err = new Error(`gemini-http-${response.status}`);
    err.code = "internal";
    err.detail = detail.slice(0, 500);
    throw err;
  }

  const json = await response.json();
  const usageMetadata = json?.usageMetadata ?? null;
  recordDynoIntelGeminiTelemetry({
    route: resolveGeminiTelemetryRoute(model),
    model,
    promptTokenCount: usageMetadata?.promptTokenCount ?? null,
    cachedContentTokenCount: usageMetadata?.cachedContentTokenCount ?? null,
    candidatesTokenCount: usageMetadata?.candidatesTokenCount ?? null,
    totalTokenCount: usageMetadata?.totalTokenCount ?? null,
    usageMetadata,
  });
  const text = extractGeminiTextPayload(json);

  if (!text) {
    const err = new Error("gemini-empty-response");
    err.code = "internal";
    throw err;
  }

  const replyLocale = resolveReplyLocale(context);
  const parsed = parseGeminiStructuredJson(text);
  if (!parsed) {
    const salvaged = salvagePartialGeminiReply(text, replyLocale, context);
    if (salvaged) return salvaged;
    const err = new Error("gemini-invalid-json");
    err.code = "internal";
    err.detail = text.slice(0, 500);
    throw err;
  }

  return normalizeGeminiReply(parsed, replyLocale, context, userQuestion);
}

async function invokeWithCacheResolution(apiKey, basePayload, model, { skipCache = false } = {}) {
  let cachedContentName = null;
  if (!skipCache) {
    const cacheResolution = await resolveGeminiContextCache({
      apiKey,
      model,
      locale: basePayload.locale,
      systemInstruction: basePayload.systemInstruction,
      promptTemplateId: basePayload.promptTemplateId,
    });
    cachedContentName = cacheResolution.cacheName;
  }

  return invokeGeminiOnce({
    ...basePayload,
    model,
    cachedContentName,
  });
}

/**
 * Calls Gemini with structured JSON output.
 * Design intent (WHY): API key stays server-side; client only sends de-identified context.
 */
export async function runGeminiDynoIntel({
  context,
  userQuestion,
  promptTemplateId = "system_v1",
}) {
  const apiKey = requireGeminiApiKey();
  const replyLocale = resolveReplyLocale(context);
  const systemInstruction = loadSystemPrompt(promptTemplateId, replyLocale);
  resolveDynoIntelRoutingIntent(userQuestion, context?.intent);
  const model = resolveDynoIntelGeminiModel(userQuestion);

  const basePayload = {
    apiKey,
    systemInstruction,
    context: buildGeminiInferencePayload(context),
    userQuestion,
    promptTemplateId,
    locale: replyLocale,
  };

  let lastError;
  let skipCacheOnNextAttempt = false;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const reply = await invokeWithCacheResolution(apiKey, basePayload, model, {
        skipCache: skipCacheOnNextAttempt,
      });
      return { reply, inferenceRoute: "gemini" };
    } catch (err) {
      lastError = err;
      const status = String(err?.message ?? "");

      // WHY: 400 / malformed JSON never retry — bill amplification with no quality gain.
      if (
        status.includes("gemini-http-400") ||
        status === "gemini-invalid-json" ||
        status === "gemini-empty-response"
      ) {
        break;
      }

      const httpStatus = Number.parseInt(status.replace("gemini-http-", ""), 10);
      const cacheRecoverable =
        status.startsWith("gemini-http-") &&
        !skipCacheOnNextAttempt &&
        (httpStatus === 429 || httpStatus >= 500);

      if (cacheRecoverable && attempt < 2) {
        invalidateGeminiContextCache(replyLocale, model);
        skipCacheOnNextAttempt = true;
        continue;
      }

      break;
    }
  }

  const fallbackSeed = resolveDeterministicDynoIntelReply(context, userQuestion);
  if (fallbackSeed) {
    recordDynoIntelGeminiTelemetry({
      route: "deterministic-fallback",
      model,
      fallbackReason: String(lastError?.message ?? "unknown"),
      promptTokenCount: 0,
      cachedContentTokenCount: 0,
      candidatesTokenCount: 0,
      totalTokenCount: 0,
      usageMetadata: null,
    });
    return {
      reply: finalizeDynoIntelCallableReply(fallbackSeed, context, userQuestion, replyLocale),
      inferenceRoute: "deterministic-fallback",
    };
  }

  throw lastError;
}
