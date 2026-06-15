import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import {
  computePromptVersionHash,
  isExplicitContextCacheEligible,
  normalizeGeminiModelId,
  resetGeminiContextCacheForTests,
  resolveContextCacheLocaleKey,
  resolveContextCacheMemoKey,
  resolveGeminiContextCache,
} from "../dynoIntel/geminiContextCache.js";

const API_KEY = "test-api-key";
const MODEL = "gemini-2.5-flash-lite";
const SYSTEM_PROMPT = "x".repeat(3000);

function mockFetch(handler) {
  return mock.fn(async (url, init) => {
    const parsed = new URL(url);
    const path = parsed.pathname;
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(init.body) : null;
    return handler({ path, method, body });
  });
}

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(payload),
    json: async () => payload,
  };
}

describe("computePromptVersionHash", () => {
  it("is stable for identical prompt text", () => {
    const a = computePromptVersionHash("constitution v2.3");
    const b = computePromptVersionHash("constitution v2.3");
    assert.equal(a, b);
    assert.equal(a.length, 64);
  });

  it("changes when prompt text changes", () => {
    const a = computePromptVersionHash("v2.3");
    const b = computePromptVersionHash("v2.3.2");
    assert.notEqual(a, b);
  });
});

describe("resolveContextCacheLocaleKey", () => {
  it("maps en separately from zh-Hant", () => {
    assert.equal(resolveContextCacheLocaleKey("en"), "en");
    assert.equal(resolveContextCacheLocaleKey("zh-Hant"), "zh-Hant");
  });
});

describe("isExplicitContextCacheEligible", () => {
  it("allows only system_v1", () => {
    assert.equal(isExplicitContextCacheEligible("system_v1"), true);
    assert.equal(isExplicitContextCacheEligible("custom_v2"), false);
  });
});

describe("normalizeGeminiModelId", () => {
  it("prefixes bare model ids with models/", () => {
    assert.equal(normalizeGeminiModelId("gemini-2.5-flash-lite"), "models/gemini-2.5-flash-lite");
  });
});

describe("resolveContextCacheMemoKey", () => {
  it("isolates flash and lite caches per locale", () => {
    const lite = resolveContextCacheMemoKey("zh-Hant", "gemini-2.5-flash-lite");
    const flash = resolveContextCacheMemoKey("zh-Hant", "gemini-2.5-flash");
    assert.notEqual(lite, flash);
    assert.equal(lite, "zh-Hant:gemini-2.5-flash-lite");
    assert.equal(flash, "zh-Hant:gemini-2.5-flash");
  });
});

describe("resolveGeminiContextCache", () => {
  let originalFetch;

  beforeEach(() => {
    resetGeminiContextCacheForTests();
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    resetGeminiContextCacheForTests();
  });

  it("creates a cache on cold start", async () => {
    const calls = [];
    globalThis.fetch = mockFetch(({ path, method, body }) => {
      calls.push({ path, method, body });
      if (path === "/v1beta/cachedContents" && method === "POST") {
        return jsonResponse({
          name: "cachedContents/zh-cache-1",
          expireTime: new Date(Date.now() + 3600_000).toISOString(),
        });
      }
      return jsonResponse({}, 404);
    });

    const result = await resolveGeminiContextCache({
      apiKey: API_KEY,
      model: MODEL,
      locale: "zh-Hant",
      systemInstruction: SYSTEM_PROMPT,
    });

    assert.equal(result.cacheName, "cachedContents/zh-cache-1");
    assert.equal(result.created, true);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].method, "POST");
    assert.equal(calls[0].body.model, "models/gemini-2.5-flash-lite");
    assert.equal(calls[0].body.displayName, "dyno-intel-zh-Hant-gemini-2.5-flash-lite-system-v1");
  });

  it("reuses memoized cache without extra network calls", async () => {
    let postCount = 0;
    globalThis.fetch = mockFetch(({ path, method }) => {
      if (path === "/v1beta/cachedContents" && method === "POST") {
        postCount += 1;
        return jsonResponse({
          name: "cachedContents/en-cache-1",
          expireTime: new Date(Date.now() + 3600_000).toISOString(),
        });
      }
      return jsonResponse({}, 404);
    });

    const first = await resolveGeminiContextCache({
      apiKey: API_KEY,
      model: MODEL,
      locale: "en",
      systemInstruction: SYSTEM_PROMPT,
    });
    const second = await resolveGeminiContextCache({
      apiKey: API_KEY,
      model: MODEL,
      locale: "en",
      systemInstruction: SYSTEM_PROMPT,
    });

    assert.equal(first.cacheName, "cachedContents/en-cache-1");
    assert.equal(second.cacheName, "cachedContents/en-cache-1");
    assert.equal(second.created, false);
    assert.equal(postCount, 1);
  });

  it("refreshes TTL when cache is near expiry", async () => {
    const calls = [];
    globalThis.fetch = mockFetch(({ path, method, body }) => {
      calls.push({ path, method, body });
      if (path === "/v1beta/cachedContents" && method === "POST") {
        return jsonResponse({
          name: "cachedContents/zh-cache-ttl",
          expireTime: new Date(Date.now() + 5 * 60_000).toISOString(),
        });
      }
      if (path.endsWith("/cachedContents/zh-cache-ttl") && method === "PATCH") {
        return jsonResponse({
          name: "cachedContents/zh-cache-ttl",
          expireTime: new Date(Date.now() + 3600_000).toISOString(),
        });
      }
      return jsonResponse({}, 404);
    });

    const first = await resolveGeminiContextCache({
      apiKey: API_KEY,
      model: MODEL,
      locale: "zh-Hant",
      systemInstruction: SYSTEM_PROMPT,
      nowMs: Date.now(),
    });
    assert.equal(first.created, true);

    const refreshed = await resolveGeminiContextCache({
      apiKey: API_KEY,
      model: MODEL,
      locale: "zh-Hant",
      systemInstruction: SYSTEM_PROMPT,
      refreshBufferMs: 10 * 60_000,
      nowMs: Date.now() + 60_000,
    });

    assert.equal(refreshed.refreshed, true);
    assert.equal(refreshed.cacheName, "cachedContents/zh-cache-ttl");
    assert.ok(calls.some((c) => c.method === "PATCH"));
  });

  it("deletes and recreates cache when prompt hash changes", async () => {
    const calls = [];
    let createCount = 0;
    globalThis.fetch = mockFetch(({ path, method, body }) => {
      calls.push({ path, method, body });
      if (path === "/v1beta/cachedContents" && method === "POST") {
        createCount += 1;
        return jsonResponse({
          name: `cachedContents/zh-cache-v${createCount}`,
          expireTime: new Date(Date.now() + 3600_000).toISOString(),
        });
      }
      if (method === "DELETE") {
        return jsonResponse(null, 204);
      }
      return jsonResponse({}, 404);
    });

    const first = await resolveGeminiContextCache({
      apiKey: API_KEY,
      model: MODEL,
      locale: "zh-Hant",
      systemInstruction: SYSTEM_PROMPT,
    });
    assert.equal(first.cacheName, "cachedContents/zh-cache-v1");

    const second = await resolveGeminiContextCache({
      apiKey: API_KEY,
      model: MODEL,
      locale: "zh-Hant",
      systemInstruction: `${SYSTEM_PROMPT}\n# v2.3.2`,
    });

    assert.equal(second.created, true);
    assert.equal(second.cacheName, "cachedContents/zh-cache-v2");
    assert.ok(calls.some((c) => c.method === "DELETE"));
    assert.equal(calls.filter((c) => c.method === "POST").length, 2);
  });

  it("falls back gracefully when cache create fails", async () => {
    globalThis.fetch = mockFetch(({ path, method }) => {
      if (path === "/v1beta/cachedContents" && method === "POST") {
        return jsonResponse({ error: { message: "too few tokens" } }, 400);
      }
      return jsonResponse({}, 404);
    });

    const result = await resolveGeminiContextCache({
      apiKey: API_KEY,
      model: MODEL,
      locale: "zh-Hant",
      systemInstruction: "short",
    });

    assert.equal(result.cacheName, null);
    assert.equal(result.fallback, true);
  });

  it("skips explicit cache for non-system_v1 prompt templates", async () => {
    let fetchCalled = false;
    globalThis.fetch = mockFetch(() => {
      fetchCalled = true;
      return jsonResponse({}, 404);
    });

    const result = await resolveGeminiContextCache({
      apiKey: API_KEY,
      model: MODEL,
      locale: "zh-Hant",
      systemInstruction: SYSTEM_PROMPT,
      promptTemplateId: "custom_v2",
    });

    assert.equal(result.skipped, true);
    assert.equal(result.cacheName, null);
    assert.equal(fetchCalled, false);
  });

  it("recreates cache when model id changes", async () => {
    let createCount = 0;
    globalThis.fetch = mockFetch(({ path, method }) => {
      if (path === "/v1beta/cachedContents" && method === "POST") {
        createCount += 1;
        return jsonResponse({
          name: `cachedContents/model-v${createCount}`,
          expireTime: new Date(Date.now() + 3600_000).toISOString(),
        });
      }
      if (method === "DELETE") {
        return jsonResponse(null, 204);
      }
      return jsonResponse({}, 404);
    });

    const first = await resolveGeminiContextCache({
      apiKey: API_KEY,
      model: "gemini-2.5-flash-lite",
      locale: "en",
      systemInstruction: SYSTEM_PROMPT,
    });
    const second = await resolveGeminiContextCache({
      apiKey: API_KEY,
      model: "gemini-2.5-flash",
      locale: "en",
      systemInstruction: SYSTEM_PROMPT,
    });

    assert.equal(first.cacheName, "cachedContents/model-v1");
    assert.equal(second.cacheName, "cachedContents/model-v2");
    assert.equal(createCount, 2);
  });

  it("deduplicates concurrent cache resolves per locale", async () => {
    let createCount = 0;
    globalThis.fetch = mockFetch(async ({ path, method }) => {
      if (path === "/v1beta/cachedContents" && method === "POST") {
        createCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return jsonResponse({
          name: "cachedContents/concurrent-1",
          expireTime: new Date(Date.now() + 3600_000).toISOString(),
        });
      }
      return jsonResponse({}, 404);
    });

    const [a, b] = await Promise.all([
      resolveGeminiContextCache({
        apiKey: API_KEY,
        model: MODEL,
        locale: "zh-Hant",
        systemInstruction: SYSTEM_PROMPT,
      }),
      resolveGeminiContextCache({
        apiKey: API_KEY,
        model: MODEL,
        locale: "zh-Hant",
        systemInstruction: SYSTEM_PROMPT,
      }),
    ]);

    assert.equal(a.cacheName, "cachedContents/concurrent-1");
    assert.equal(b.cacheName, "cachedContents/concurrent-1");
    assert.equal(createCount, 1);
  });
});
