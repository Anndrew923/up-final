import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isHallOfFameConsultQuestion,
  resolveHallOfFameConsultReply,
  resolveHallOfFameConsultTier,
} from "../dynoIntel/hallOfFameConsultGate.js";
import { finalizeDynoIntelCallableReply } from "../dynoIntel/gemini.js";

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
    assert.equal(isHallOfFameConsultQuestion("Who are the Pantheon legends?"), true);
    assert.equal(isHallOfFameConsultQuestion("Hall of Fame names above 80?"), true);
    assert.equal(isHallOfFameConsultQuestion("還有誰也是80多分？"), true);
    assert.equal(isHallOfFameConsultQuestion("Who else is in the 90s?"), true);
    assert.equal(isHallOfFameConsultQuestion("我想知道更多80多分的運動員"), true);
    assert.equal(isHallOfFameConsultQuestion("Tell me more about players in the 110s"), true);
    assert.equal(isHallOfFameConsultQuestion("怪物領域有誰"), true);
    assert.equal(isHallOfFameConsultQuestion("我的心肺表現如何？"), false);
    assert.equal(isHallOfFameConsultQuestion("How is my cardio?"), false);
    assert.equal(isHallOfFameConsultQuestion("我的絕對力量表現如何？"), false);
    assert.equal(isHallOfFameConsultQuestion("Tell me more about my strength"), false);
  });

  it("parses consult tier from score-band questions", () => {
    assert.equal(resolveHallOfFameConsultTier("100分以上有哪些名人？")?.decadeKey, "100");
    assert.equal(resolveHallOfFameConsultTier("140-150 有哪些傳奇？")?.decadeKey, "140");
    assert.equal(resolveHallOfFameConsultTier("Hall of Fame names above 80?")?.decadeKey, "80");
    assert.equal(resolveHallOfFameConsultTier("還有誰也是80多分？")?.decadeKey, "80");
    assert.equal(resolveHallOfFameConsultTier("Who else is in the 90s?")?.decadeKey, "90");
    assert.equal(resolveHallOfFameConsultTier("我想知道更多80多分的運動員")?.decadeKey, "80");
    assert.equal(resolveHallOfFameConsultTier("Tell me more about players in the 110s")?.decadeKey, "110");
  });

  it("v5.7 — athlete roster colloquial asks unlock pantheon (not status chassis praise)", () => {
    const zhReply = resolveHallOfFameConsultReply(baseContext, "我想知道更多80多分的運動員");
    assert.ok(zhReply);
    assert.equal(zhReply.hallOfFameConsultReply, true);
    assert.match(zhReply.commentary, /80-90（高階玩家）/);
    assert.match(zhReply.commentary, /萬神殿對帳權限/);
    assert.doesNotMatch(zhReply.commentary, /以同齡一般人來看/);
    assert.doesNotMatch(zhReply.commentary, /進階健身者/);

    const enReply = resolveHallOfFameConsultReply(
      { ...baseContext, locale: "en", overallScore: 115 },
      "Tell me more about players in the 110s"
    );
    assert.ok(enReply);
    assert.equal(enReply.hallOfFameConsultReply, true);
    assert.match(enReply.commentary, /110-120 \(Transcendent tier\)/);
    assert.match(enReply.commentary, /Pantheon benchmarking/i);
    assert.doesNotMatch(enReply.commentary, /Against same-age/);
    assert.doesNotMatch(enReply.commentary, /[\u4e00-\u9fff]/);
  });

  it("v5.6 — colloquial peer asks unlock aggregate pantheon roster (not status chassis praise)", () => {
    const zhReply = resolveHallOfFameConsultReply(baseContext, "還有誰也是80多分？");
    assert.ok(zhReply);
    assert.equal(zhReply.hallOfFameConsultReply, true);
    assert.match(zhReply.commentary, /80-90（高階玩家）/);
    assert.match(zhReply.commentary, /萬神殿對帳權限/);
    assert.match(zhReply.commentary, /僅供天梯對帳與娛樂參考。$/);
    assert.doesNotMatch(zhReply.commentary, /以同齡一般人來看/);
    assert.doesNotMatch(zhReply.commentary, /進階健身者/);

    const enReply = resolveHallOfFameConsultReply(
      { ...baseContext, locale: "en", overallScore: 95 },
      "Who else is in the 90s?"
    );
    assert.ok(enReply);
    assert.equal(enReply.hallOfFameConsultReply, true);
    assert.match(enReply.commentary, /90-100 \(Top mortal tier\)/);
    assert.match(enReply.commentary, /Pantheon benchmarking/i);
    assert.match(enReply.commentary, /entertainment purposes\.$/);
    assert.doesNotMatch(enReply.commentary, /Against same-age/);
    assert.doesNotMatch(enReply.commentary, /[\u4e00-\u9fff]/);
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

  it("hard-blocks English Pantheon vagueness with EN motivational copy", () => {
    const reply = resolveHallOfFameConsultReply(
      { ...baseContext, locale: "en" },
      "Who are the Pantheon legends?"
    );
    assert.ok(reply);
    assert.match(reply.commentary, /deepest sanctum of the Dyno Intel Pantheon/i);
    assert.match(reply.commentary, /Core Mind will unlock the gateway/i);
    assert.doesNotMatch(reply.commentary, /outside my scope/i);
  });

  it("unlocks axis-specific celebrity names when the user score reaches the tier", () => {
    const reply = resolveHallOfFameConsultReply(baseContext, "力量80分以上有哪些名人？");
    assert.ok(reply);
    assert.match(reply.commentary, /力量萬神殿對帳權限/);
    assert.match(reply.commentary, /Jason Statham|Chris Hemsworth|Conor McGregor/);
    assert.match(reply.commentary, /僅供天梯對帳與娛樂參考。$/);
  });

  it("unlocks EN strength consult with English tier phrasing and zero CJK leakage", () => {
    const reply = resolveHallOfFameConsultReply(
      { ...baseContext, locale: "en" },
      "Hall of Fame names above 80 for strength?"
    );
    assert.ok(reply);
    assert.match(reply.commentary, /80-90 \(Advanced tier\)/);
    assert.match(reply.commentary, /Jason Statham|Chris Hemsworth|Conor McGregor/);
    assert.match(reply.commentary, /entertainment purposes\.$/);
    assert.doesNotMatch(reply.commentary, /[\u4e00-\u9fff]/);
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

  it("preserves consult hard-gate copy through finalize pipeline", () => {
    const ctx = {
      ...baseContext,
      userQuestion: "萬神殿有哪些傳奇？",
      intent: "general",
      gaps: [],
    };
    const raw = resolveHallOfFameConsultReply(ctx, "萬神殿有哪些傳奇？");
    const finalized = finalizeDynoIntelCallableReply(raw, ctx, "萬神殿有哪些傳奇？");
    assert.ok(raw);
    assert.equal(finalized.commentary, raw.commentary);
    assert.match(finalized.commentary, /該分數帶已正式跨入凡人頂尖的神格區間/);
    assert.doesNotMatch(finalized.commentary, /以同齡一般人來看/);
    assert.equal(finalized.hallOfFameConsultReply, undefined);
  });
});
