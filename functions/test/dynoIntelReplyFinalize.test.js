import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  enforceOffTopicContract,
  finalizeDynoIntelReply,
  stripPersonaLeakage,
  stripTechnicalLeakage,
} from "../dynoIntel/gemini.js";

describe("stripPersonaLeakage", () => {
  it("removes blacklisted persona tokens", () => {
    assert.equal(
      stripPersonaLeakage("Bruno 叔叔說你的 cardio 需要調校"),
      "說你的 cardio 需要調校"
    );
  });
});

describe("enforceOffTopicContract", () => {
  it("clears action_directive when off-topic", () => {
    assert.deepEqual(
      enforceOffTopicContract({
        commentary: "邊界宣告",
        action_directive: "做 HIIT",
        is_off_topic: true,
        detected_weakest_axis: "cardio",
      }),
      {
        commentary: "邊界宣告",
        action_directive: "",
        is_off_topic: true,
        detected_weakest_axis: "cardio",
      }
    );
  });
});

describe("stripTechnicalLeakage", () => {
  it("replaces cardCopy with product language", () => {
    assert.equal(
      stripTechnicalLeakage("只解讀六軸遙測與 cardCopy", "zh-Hant"),
      "只解讀六軸遙測與 級距解碼"
    );
  });

  it("replaces tierBandId and JSON tokens", () => {
    assert.equal(
      stripTechnicalLeakage("對齊 tierBandId 與 JSON 數據", "zh-Hant"),
      "對齊 級距 與 遙測數據 數據"
    );
  });

  it("replaces cardCopy with tier decode in English locale", () => {
    assert.equal(stripTechnicalLeakage("decode cardCopy only", "en"), "decode tier decode only");
  });

  it("preserves paragraph breaks after technical token replacement", () => {
    assert.equal(
      stripTechnicalLeakage("Line one cardCopy.\n\nLine two tierBandId.", "en"),
      "Line one tier decode.\n\nLine two tier."
    );
  });

  it("replaces supplemental telemetry field names", () => {
    assert.equal(
      stripTechnicalLeakage("Read supplementalMetrics via focusSupplemental", "en"),
      "Read supplemental telemetry via supplemental focus"
    );
  });

  it("strips camelCase axis score labels from user-facing commentary", () => {
    assert.equal(
      stripTechnicalLeakage("握力 / 抓地 (gripStrength 軸分數) 停在 98.4 分", "zh-Hant"),
      "握力 / 抓地 停在 98.4 分"
    );
  });
});

describe("finalizeDynoIntelReply", () => {
  it("strips leakage and enforces off-topic contract together", () => {
    assert.deepEqual(
      finalizeDynoIntelReply(
        {
          commentary: "布魯斯：cardCopy 顯示週期化不在資料鏈路裡",
          action_directive: "加 cardio",
          is_off_topic: true,
          detected_weakest_axis: "cardio",
        },
        "zh-Hant"
      ),
      {
        commentary: "級距解碼 顯示週期化不在服務範圍裡",
        action_directive: "",
        is_off_topic: true,
        detected_weakest_axis: "cardio",
      }
    );
  });

  it("uses English leakage replacements when locale is en", () => {
    assert.deepEqual(
      finalizeDynoIntelReply(
        {
          commentary: "cardCopy is out of scope",
          action_directive: "",
          is_off_topic: true,
          detected_weakest_axis: "cardio",
        },
        "en"
      ),
      {
        commentary: "tier decode is out of scope",
        action_directive: "",
        is_off_topic: true,
        detected_weakest_axis: "cardio",
      }
    );
  });

  it("clears action_directive for on-topic replies", () => {
    assert.equal(
      finalizeDynoIntelReply(
        {
          commentary: "三段正文",
          action_directive: "補測 grip 軸",
          is_off_topic: false,
          detected_weakest_axis: "gripStrength",
        },
        "zh-Hant"
      ).action_directive,
      ""
    );
  });
});
