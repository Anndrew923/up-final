import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  enforceOnTopicRail,
  shouldForceDynoIntelOnTopic,
} from "../dynoIntel/enforceOnTopicRail.js";

const bodyFatContext = {
  locale: "zh-Hant",
  mode: "cross-axis",
  intent: "methodology",
  closingBeatKind: "methodology-nudge",
  questionFocusAxis: "bodyFat",
  gaps: [],
  scoringMethodologyBriefs: [
    {
      metric: "bodyFat",
      title: "FFMI 計分",
      body: "本 App 以身高與去脂體重換算 FFMI 常模。",
    },
  ],
  axes: [
    {
      axis: "bodyFat",
      score: 96,
      tierBandId: "TIER_95",
      cardCopy: { title: "頂規排量", summary: "FFMI 96" },
    },
  ],
};

describe("shouldForceDynoIntelOnTopic", () => {
  it("forces on-topic for FFMI focus and methodology intent", () => {
    assert.equal(shouldForceDynoIntelOnTopic("FFMI", bodyFatContext), true);
    assert.equal(shouldForceDynoIntelOnTopic("ＦＦＭＩ", bodyFatContext), true);
  });

  it("does not force on-topic for unrelated trivia without axis keywords", () => {
    assert.equal(
      shouldForceDynoIntelOnTopic("今晚吃什麼比較健康？", {
        locale: "zh-Hant",
        mode: "cross-axis",
        intent: "general",
        gaps: [],
        axes: [],
      }),
      false
    );
  });

  it("does not force on-topic for coaching prescription asks with axis keywords", () => {
    assert.equal(
      shouldForceDynoIntelOnTopic("我的力量要如何進步呢？", {
        locale: "zh-Hant",
        mode: "cross-axis",
        intent: "coaching",
        gaps: [],
        axes: bodyFatContext.axes,
      }),
      false
    );
  });
});

describe("enforceOnTopicRail", () => {
  it("overrides model off-topic misclassification for FFMI", () => {
    const reply = {
      commentary:
        "我是這台《最強肉體》主機上的 DYNO INTEL，只解讀你的六軸遙測、級距解碼，以及本 App 的給分標準說明，FFMI 不在我的服務範圍內。",
      action_directive: "",
      is_off_topic: true,
      detected_weakest_axis: "bodyFat",
    };
    const repaired = enforceOnTopicRail(reply, bodyFatContext, "FFMI");
    assert.equal(repaired.is_off_topic, false);
    assert.ok(!repaired.commentary.includes("不在我的服務範圍內"));
    assert.match(repaired.commentary, /FFMI|去脂|身高/);
  });
});
