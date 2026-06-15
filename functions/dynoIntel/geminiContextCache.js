import { createHash } from "node:crypto";
import {
  DYNO_INTEL_GEMINI_CONTEXT_CACHE_REFRESH_BUFFER_MS,
  DYNO_INTEL_GEMINI_CONTEXT_CACHE_TTL_SECONDS,
  DYNO_INTEL_GEMINI_MODEL_LITE,
} from "../shared/constants.js";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const EXPLICIT_CACHE_PROMPT_TEMPLATE_ID = "system_v1";

/**
 * WHY: Per-instance memo keyed by locale + model — flash and lite each keep their own Google cache.
 * Prompt hash guards against stale constitution after system_v1*.txt edits.
 */
/** @type {Map<string, { cacheName: string, promptHash: string, modelId: string, expiresAtMs: number }>} */
const runtimeCacheByKey = new Map();

/** @type {Map<string, Promise<object>>} */
const inFlightByKey = new Map();

export function isExplicitContextCacheEligible(promptTemplateId = "system_v1") {
  return promptTemplateId === EXPLICIT_CACHE_PROMPT_TEMPLATE_ID;
}

export function computePromptVersionHash(promptText) {
  return createHash("sha256").update(String(promptText ?? ""), "utf8").digest("hex");
}

export function resolveContextCacheLocaleKey(locale) {
  return locale === "en" ? "en" : "zh-Hant";
}

export function normalizeGeminiModelId(model) {
  const id = String(model ?? DYNO_INTEL_GEMINI_MODEL_LITE).trim();
  if (!id) return `models/${DYNO_INTEL_GEMINI_MODEL_LITE}`;
  return id.startsWith("models/") ? id : `models/${id}`;
}

export function resolveContextCacheMemoKey(locale, model) {
  const localeKey = resolveContextCacheLocaleKey(locale);
  const modelSlug = normalizeGeminiModelId(model).replace(/^models\//, "");
  return `${localeKey}:${modelSlug}`;
}

function parseExpireTimeMs(expireTime, fallbackTtlSeconds) {
  const parsed = new Date(expireTime ?? 0).getTime();
  if (Number.isFinite(parsed) && parsed > Date.now()) {
    return parsed;
  }
  return Date.now() + fallbackTtlSeconds * 1000;
}

function isMemoEntryValid(existing, { promptHash, modelId, nowMs, refreshBufferMs }) {
  if (!existing?.cacheName) return false;
  if (existing.promptHash !== promptHash) return false;
  if (existing.modelId !== modelId) return false;
  return existing.expiresAtMs - nowMs > refreshBufferMs;
}

async function geminiApiRequest(apiKey, path, { method = "GET", body } = {}) {
  const response = await fetch(`${GEMINI_API_BASE}${path}?key=${apiKey}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const detail = await response.text();
    const err = new Error(`gemini-cache-http-${response.status}`);
    err.code = "internal";
    err.detail = detail.slice(0, 500);
    throw err;
  }

  if (method === "DELETE" || response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function deleteContextCache(apiKey, cacheName) {
  if (!cacheName) return;
  try {
    await geminiApiRequest(apiKey, `/${cacheName}`, { method: "DELETE" });
  } catch {
    /* best-effort — cache may already be expired */
  }
}

async function createContextCache(apiKey, model, localeKey, systemInstruction, ttlSeconds) {
  const modelSlug = normalizeGeminiModelId(model).replace(/^models\//, "");
  const json = await geminiApiRequest(apiKey, "/cachedContents", {
    method: "POST",
    body: {
      model: normalizeGeminiModelId(model),
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      displayName: `dyno-intel-${localeKey}-${modelSlug}-system-v1`,
      ttl: `${ttlSeconds}s`,
    },
  });

  const cacheName = json?.name;
  if (!cacheName) {
    const err = new Error("gemini-cache-create-missing-name");
    err.code = "internal";
    throw err;
  }

  return {
    cacheName,
    expiresAtMs: parseExpireTimeMs(json?.expireTime, ttlSeconds),
  };
}

async function refreshContextCacheTtl(apiKey, cacheName, ttlSeconds) {
  const json = await geminiApiRequest(apiKey, `/${cacheName}`, {
    method: "PATCH",
    body: { ttl: `${ttlSeconds}s` },
  });
  return parseExpireTimeMs(json?.expireTime, ttlSeconds);
}

/** Test-only reset — clears in-process memo between node:test cases. */
export function resetGeminiContextCacheForTests() {
  runtimeCacheByKey.clear();
  inFlightByKey.clear();
}

async function resolveGeminiContextCacheInternal({
  apiKey,
  model,
  locale,
  systemInstruction,
  ttlSeconds,
  refreshBufferMs,
  nowMs,
}) {
  const memoKey = resolveContextCacheMemoKey(locale, model);
  const localeKey = resolveContextCacheLocaleKey(locale);
  const promptHash = computePromptVersionHash(systemInstruction);
  const modelId = normalizeGeminiModelId(model);
  const existing = runtimeCacheByKey.get(memoKey);

  if (isMemoEntryValid(existing, { promptHash, modelId, nowMs, refreshBufferMs })) {
    return { cacheName: existing.cacheName, created: false, refreshed: false, promptHash };
  }

  if (existing?.cacheName && (existing.promptHash !== promptHash || existing.modelId !== modelId)) {
    await deleteContextCache(apiKey, existing.cacheName);
    runtimeCacheByKey.delete(memoKey);
  } else if (
    existing?.cacheName &&
    existing.promptHash === promptHash &&
    existing.modelId === modelId &&
    existing.expiresAtMs - nowMs <= refreshBufferMs
  ) {
    try {
      const expiresAtMs = await refreshContextCacheTtl(apiKey, existing.cacheName, ttlSeconds);
      runtimeCacheByKey.set(memoKey, { ...existing, expiresAtMs });
      return { cacheName: existing.cacheName, created: false, refreshed: true, promptHash };
    } catch {
      await deleteContextCache(apiKey, existing.cacheName);
      runtimeCacheByKey.delete(memoKey);
    }
  }

  try {
    const { cacheName, expiresAtMs } = await createContextCache(
      apiKey,
      model,
      localeKey,
      systemInstruction,
      ttlSeconds
    );
    runtimeCacheByKey.set(memoKey, { cacheName, promptHash, modelId, expiresAtMs });
    return { cacheName, created: true, refreshed: false, promptHash };
  } catch (err) {
    console.warn(
      "[geminiContextCache] create failed — falling back to inline systemInstruction",
      err?.message
    );
    return { cacheName: null, created: false, refreshed: false, promptHash, fallback: true };
  }
}

/**
 * Resolves (or creates) an Explicit Context Cache for the locale-specific system prompt.
 * Design intent (WHY): cached prefix bills at ~10% of input token rate on Gemini 2.5.
 */
export async function resolveGeminiContextCache({
  apiKey,
  model,
  locale,
  systemInstruction,
  promptTemplateId = EXPLICIT_CACHE_PROMPT_TEMPLATE_ID,
  ttlSeconds = DYNO_INTEL_GEMINI_CONTEXT_CACHE_TTL_SECONDS,
  refreshBufferMs = DYNO_INTEL_GEMINI_CONTEXT_CACHE_REFRESH_BUFFER_MS,
  nowMs = Date.now(),
}) {
  if (!isExplicitContextCacheEligible(promptTemplateId)) {
    return { cacheName: null, created: false, refreshed: false, promptHash: null, skipped: true };
  }

  const memoKey = resolveContextCacheMemoKey(locale, model);
  const inFlight = inFlightByKey.get(memoKey);
  if (inFlight) {
    return inFlight;
  }

  const work = resolveGeminiContextCacheInternal({
    apiKey,
    model,
    locale,
    systemInstruction,
    ttlSeconds,
    refreshBufferMs,
    nowMs,
  });

  inFlightByKey.set(memoKey, work);
  try {
    return await work;
  } finally {
    inFlightByKey.delete(memoKey);
  }
}

/** WHY: generateContent may reject an expired cache — drop memo so next call recreates. */
export function invalidateGeminiContextCache(locale, model) {
  runtimeCacheByKey.delete(resolveContextCacheMemoKey(locale, model));
}
