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
    assert.equal(resolveDynoQuestionIntent("握力怎麼評測的？"), "methodology");
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

  it("routes axis panel-read questions to status under v3.0.3", () => {
    assert.equal(
      resolveDynoQuestionIntent("我的握力標準how", {
        mode: "single-axis",
        focusAxis: "gripStrength",
      }),
      "status"
    );
  });

  it("detects progress and status intents", () => {
    assert.equal(resolveDynoQuestionIntent("我有進步嗎？"), "progress");
    assert.equal(resolveDynoQuestionIntent("幫我解讀這個狀態"), "status");
    assert.equal(resolveDynoQuestionIntent("我的握力分數表現如何"), "status");
    assert.equal(resolveDynoQuestionIntent("那我握力成績如何？"), "status");
    assert.equal(resolveDynoQuestionIntent("我的 FFMI 評分如何？"), "status");
    assert.equal(resolveDynoQuestionIntent("我的ＦＦＭＩ評分如何？"), "status");
  });

  it("keeps methodology for scoring-standard questions", () => {
    assert.equal(resolveDynoQuestionIntent("FFMI 評分標準是什麼？"), "methodology");
    assert.equal(resolveDynoQuestionIntent("FFMI 評分怎麼算？"), "methodology");
  });

  it("defaults axis-only reads to status under v3.0.3", () => {
    assert.equal(resolveDynoQuestionIntent("我的 FFMI 分數代表什麼？"), "status");
    assert.equal(resolveDynoQuestionIntent("我的評分多少？"), "general");
  });

  it("locks chassis macro score reads to status before methodology", () => {
    assert.equal(resolveDynoQuestionIntent("How is my total score?"), "status");
    assert.equal(resolveDynoQuestionIntent("How is my average score?"), "status");
    assert.equal(resolveDynoQuestionIntent("How is my score?"), "status");
    assert.notEqual(resolveDynoQuestionIntent("How is grip score calculated?"), "status");
    assert.equal(resolveDynoQuestionIntent("how to compute my total score"), "methodology");
    assert.equal(resolveDynoQuestionIntent("How is my total score calculated?"), "methodology");
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
    assert.equal(resolveDynoIntelRoutingIntent("FFMI 分數多少？", "general"), "status");
  });
});
