import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isHallOfFameConsultQuestion,
  resolveHallOfFameConsultReply,
  resolveHallOfFameConsultTier,
} from "../dynoIntel/hallOfFameConsultGate.js";

const baseContext = {
  locale: "zh-Hant",
  mode: "cross-axis",
  weakestAxis: "gripStrength",
  overallScore: 88,
  axes: [
    { axis: "strength", score: 87.8, tierBandId: "TIER_80", cardCopy: { title: "x", summary: "x" } },
    { axis: "cardio", score: 65, tierBandId: "TIER_60", cardCopy: { title: "x", summary: "x" } },
  ],
  supplementalMetrics: [{ metric: "armSize", score: 102, tierBandId: "TIER_100" }],
};

describe("hallOfFameConsultGate", () => {
  it("detects consult intent without over-broad 聖殿 false positives", () => {
    assert.equal(isHallOfFameConsultQuestion("100分以上有哪些名人？"), true);
    assert.equal(isHallOfFameConsultQuestion("萬神殿有哪些傳奇？"), true);
    assert.equal(isHallOfFameConsultQuestion("我的心肺表現如何？"), false);
  });

  it("parses consult tier from score-band questions", () => {
    assert.equal(resolveHallOfFameConsultTier("100分以上有哪些名人？")?.decadeKey, "100");
    assert.equal(resolveHallOfFameConsultTier("140-150 有哪些傳奇？")?.decadeKey, "140");
  });

  it("blocks locked tier consultations when overall score is insufficient", () => {
    const reply = resolveHallOfFameConsultReply(baseContext, "100分以上有哪些名人？");
    assert.ok(reply);
    assert.match(reply.commentary, /該分數帶已正式跨入凡人頂尖的神格區間/);
    assert.match(reply.commentary, /尚未解鎖該重力場/);
    assert.doesNotMatch(reply.commentary, /大谷翔平|阿諾|Jason/);
    assert.doesNotMatch(reply.commentary, /不在我的服務範圍內/);
  });

  it("hard-blocks tier-less hall consult vagueness with motivational copy", () => {
    const reply = resolveHallOfFameConsultReply(baseContext, "萬神殿有哪些傳奇？");
    assert.ok(reply);
    assert.equal(reply.is_off_topic, false);
    assert.match(reply.commentary, /該分數帶已正式跨入凡人頂尖的神格區間/);
    assert.match(reply.commentary, /天梯大腦會在你的專屬報告中/);
    assert.doesNotMatch(reply.commentary, /不在我的服務範圍內/);
  });

  it("unlocks axis-specific celebrity names when the user score reaches the tier", () => {
    const reply = resolveHallOfFameConsultReply(baseContext, "力量80分以上有哪些名人？");
    assert.ok(reply);
    assert.match(reply.commentary, /力量萬神殿對帳權限/);
    assert.match(reply.commentary, /Jason Statham|Chris Hemsworth|Conor McGregor/);
    assert.match(reply.commentary, /僅供天梯對帳與娛樂參考。$/);
  });

  it("keeps blank unlocked cells disclaimer-free", () => {
    const reply = resolveHallOfFameConsultReply(
      { ...baseContext, overallScore: 155, axes: [{ axis: "explosivePower", score: 75, tierBandId: "TIER_70", cardCopy: { title: "x", summary: "x" } }] },
      "爆發力70分以上有哪些名人？"
    );
    assert.ok(reply);
    assert.match(reply.commentary, /空白錨點/);
    assert.doesNotMatch(reply.commentary, /僅供天梯對帳與娛樂參考/);
  });
});
