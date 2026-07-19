import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DYNO_INTEL_GEMINI_MODEL_LITE,
  DYNO_INTEL_GEMINI_MODEL_METHODOLOGY,
} from "../shared/constants.js";
import {
  readLastGeminiUsageMetadata,
  recordDynoIntelGeminiTelemetry,
  recordDynoIntelRouteTelemetry,
  resetDynoIntelGeminiTelemetryForTests,
  resolveGeminiTelemetryRoute,
} from "../dynoIntel/geminiTelemetry.js";

describe("resolveGeminiTelemetryRoute", () => {
  it("maps lite and methodology models to stable route labels", () => {
    assert.equal(resolveGeminiTelemetryRoute(DYNO_INTEL_GEMINI_MODEL_LITE), "gemini-lite");
    assert.equal(resolveGeminiTelemetryRoute(DYNO_INTEL_GEMINI_MODEL_METHODOLOGY), "gemini-flash");
    assert.equal(resolveGeminiTelemetryRoute(`models/${DYNO_INTEL_GEMINI_MODEL_LITE}`), "gemini-lite");
  });
});

describe("recordDynoIntelGeminiTelemetry", () => {
  it("stores usageMetadata for readLastGeminiUsageMetadata", () => {
    resetDynoIntelGeminiTelemetryForTests();
    recordDynoIntelGeminiTelemetry({
      route: "gemini-lite",
      model: DYNO_INTEL_GEMINI_MODEL_LITE,
      usageMetadata: { promptTokenCount: 42, candidatesTokenCount: 12 },
    });
    assert.deepEqual(readLastGeminiUsageMetadata(), {
      promptTokenCount: 42,
      candidatesTokenCount: 12,
    });
    resetDynoIntelGeminiTelemetryForTests();
  });

  it("redacts uid and question text from route telemetry", () => {
    const payload = recordDynoIntelRouteTelemetry({
      route: "gemini-lite",
      intent: "status",
      uid: "private-user-id",
      userQuestion: "private health question",
    });
    assert.equal("uid" in payload, false);
    assert.equal("userQuestion" in payload, false);
    assert.equal(payload.questionLength, 23);
    assert.match(payload.requestHash, /^[a-f0-9]{24}$/);
    assert.equal(payload.intent, "status");
  });
});
