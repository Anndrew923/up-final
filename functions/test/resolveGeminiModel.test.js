import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DYNO_INTEL_GEMINI_MODEL_LITE,
  DYNO_INTEL_GEMINI_MODEL_METHODOLOGY,
} from "../shared/constants.js";
import { resolveDynoIntelGeminiModel, resolveDynoIntelRoutingIntent } from "../dynoIntel/resolveGeminiModel.js";
import { resolveDynoQuestionIntent, shouldEscalateMethodologyViaHeuristic } from "../dynoIntel/resolveQuestionIntent.js";

describe("resolveDynoQuestionIntent", () => {
  it("detects methodology questions", () => {
    assert.equal(resolveDynoQuestionIntent("本 App 力量怎麼計分？"), "methodology");
    assert.equal(resolveDynoQuestionIntent("How does this app score strength?"), "methodology");
    assert.equal(resolveDynoQuestionIntent("握力分數是如何評斷的？"), "methodology");
  });

  it("escalates methodology via heuristic when axis and probes align", () => {
    assert.equal(
      shouldEscalateMethodologyViaHeuristic("grip score standard how", {
        mode: "cross-axis",
        focusAxis: null,
      }),
      true
    );
    assert.equal(
      resolveDynoQuestionIntent("grip score standard how", {
        mode: "cross-axis",
        focusAxis: null,
      }),
      "methodology"
    );
  });

  it("does not escalate panel-read questions", () => {
    assert.equal(
      resolveDynoQuestionIntent("我的握力標準how", {
        mode: "single-axis",
        focusAxis: "gripStrength",
      }),
      "general"
    );
  });

  it("detects progress and status intents", () => {
    assert.equal(resolveDynoQuestionIntent("我有進步嗎？"), "progress");
    assert.equal(resolveDynoQuestionIntent("幫我解讀這個狀態"), "status");
  });

  it("defaults to general for telemetry reads", () => {
    assert.equal(resolveDynoQuestionIntent("我的 FFMI 分數代表什麼？"), "general");
    assert.equal(resolveDynoQuestionIntent("我的評分多少？"), "general");
  });
});

describe("resolveDynoIntelGeminiModel", () => {
  it("routes methodology to flash", () => {
    assert.equal(
      resolveDynoIntelGeminiModel("DOTS 和 Brzycki 怎麼影響分數？"),
      DYNO_INTEL_GEMINI_MODEL_METHODOLOGY
    );
  });

  it("routes status/progress/general to flash-lite", () => {
    assert.equal(resolveDynoIntelGeminiModel("我有進步嗎？"), DYNO_INTEL_GEMINI_MODEL_LITE);
    assert.equal(resolveDynoIntelGeminiModel("幫我解讀狀態"), DYNO_INTEL_GEMINI_MODEL_LITE);
    assert.equal(resolveDynoIntelGeminiModel("FFMI 分數多少？"), DYNO_INTEL_GEMINI_MODEL_LITE);
  });

  it("routes grip methodology adjudication to flash", () => {
    assert.equal(
      resolveDynoIntelGeminiModel("握力分數是如何評斷的？"),
      DYNO_INTEL_GEMINI_MODEL_METHODOLOGY
    );
  });
});

describe("resolveDynoIntelRoutingIntent", () => {
  it("returns server-resolved intent", () => {
    assert.equal(resolveDynoIntelRoutingIntent("本 App 力量怎麼計分？", "general"), "methodology");
    assert.equal(resolveDynoIntelRoutingIntent("FFMI 分數多少？", "general"), "general");
  });
});
