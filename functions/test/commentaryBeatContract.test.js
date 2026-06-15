import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  beat3FeatureAnchorsPresent,
  enforceCommentaryBeatContract,
  extractBeat3FeatureAnchors,
} from "../dynoIntel/commentaryBeatContract.js";

const methodologyContext = {
  gaps: [],
  closingBeatKind: "methodology-nudge",
  replyClosingCue: "力量 / 馬力停在 87.9 分——這份遙測主機已鎖定，值得你下次通電再對照。",
  closingBeatSecondLine:
    "各評測頁面備有更完整的計分說明與常模解讀——請直接進入對應評測頁，展開說明區查閱全貌。",
};

const strengthContext = {
  gaps: [],
  closingBeatKind: "passion-close",
  focusAxis: "strength",
  replyClosingCue:
    "力量 / 馬力 停在 87.8 分，級距【350hp雙門跑車】——這份遙測主機已鎖定，值得你下次通電再對照。",
  closingBeatSecondLine: "保持這股鋼鐵意志，下一組通電見。",
  axes: [
    {
      axis: "strength",
      score: 87.8,
      tierBandId: "TIER_350",
      cardCopy: { title: "350hp雙門跑車", summary: "業餘運動員巔峰輸出。" },
    },
  ],
};

function countOccurrences(haystack, needle) {
  return haystack.split(needle).length - 1;
}

describe("extractBeat3FeatureAnchors", () => {
  it("resolves score and tier keyword from replyClosingCue and axes", () => {
    const anchors = extractBeat3FeatureAnchors(strengthContext);
    assert.equal(anchors.score, "87.8");
    assert.equal(anchors.tierKeyword, "350hp");
  });
});

describe("beat3FeatureAnchorsPresent", () => {
  it("detects paraphrased beat-3 when score and tier anchors both hit", () => {
    const paraphrased =
      "力量 / 馬力（strength 軸分數）停在 87.8 分，級距【350hp雙門跑車】——這份遙測主機已鎖定，值得你下次通電再對照。";
    assert.equal(beat3FeatureAnchorsPresent(paraphrased, strengthContext), true);
  });
});

describe("enforceCommentaryBeatContract", () => {
  it("splits a single methodology paragraph into three beats before beat-3 close", () => {
    const reply = {
      commentary:
        "本 App 以 Brzycki 與 IPF DOTS 綜合給分。Brzycki 專注 1RM 估算，DOTS 則正規化跨體重比較。",
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "",
    };

    const repaired = enforceCommentaryBeatContract(reply, methodologyContext);
    assert.equal(repaired.commentary.split(/\n\n+/).length, 3);
    assert.match(repaired.commentary, /Brzycki/);
    assert.match(repaired.commentary, /評測頁面備有更完整的計分說明/);
  });

  it("appends beat-3 when model stops after two methodology paragraphs", () => {
    const reply = {
      commentary:
        "DYNO INTEL 將力量評測透過 Brzycki 與 DOTS 解碼。\n\n每個完成的力量項目會先估計 1RM，再正規化為積分。",
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "",
    };

    const repaired = enforceCommentaryBeatContract(reply, methodologyContext);
    assert.match(repaired.commentary, /Brzycki/);
    assert.match(repaired.commentary, /評測頁面備有更完整的計分說明/);
    assert.match(repaired.commentary, /87\.9 分/);
    assert.equal(repaired.commentary.split(/\n\n+/).length, 3);
  });

  it("does not duplicate beat-3 when already present", () => {
    const beat3 = `${methodologyContext.replyClosingCue} ${methodologyContext.closingBeatSecondLine}`;
    const reply = {
      commentary: `第一段。\n\n第二段。\n\n${beat3}`,
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "",
    };

    const repaired = enforceCommentaryBeatContract(reply, methodologyContext);
    assert.equal(repaired.commentary, reply.commentary);
  });

  it("forces third paragraph when beat-3 content is embedded in two paragraphs", () => {
    const beat3 = `${methodologyContext.replyClosingCue} ${methodologyContext.closingBeatSecondLine}`;
    const reply = {
      commentary: `第一段。\n\n第二段含導流：${beat3}`,
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "",
    };

    const repaired = enforceCommentaryBeatContract(reply, methodologyContext);
    assert.equal(repaired.commentary.split(/\n\n+/).length, 3);
    assert.match(repaired.commentary, /評測頁面備有更完整的計分說明/);
  });

  it("skips repair for off-topic replies", () => {
    const reply = {
      commentary: "邊界宣告。",
      action_directive: "",
      is_off_topic: true,
      detected_weakest_axis: "",
    };

    const repaired = enforceCommentaryBeatContract(reply, methodologyContext);
    assert.equal(repaired.commentary, reply.commentary);
  });

  it("does not duplicate beat-3 when paraphrased third paragraph hits feature anchors", () => {
    const paraphrasedBeat3 =
      "力量 / 馬力（strength 軸分數）停在 87.8 分，級距【350hp雙門跑車】——這份遙測主機已鎖定，值得你下次通電再對照。 保持這股鋼鐵意志，下一組通電見。";
    const reply = {
      commentary: `人體神殿段。\n\n載具映射段。\n\n${paraphrasedBeat3}`,
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "",
    };

    const repaired = enforceCommentaryBeatContract(reply, strengthContext);
    assert.equal(repaired.commentary, reply.commentary);
    assert.equal(countOccurrences(repaired.commentary, "87.8"), 1);
    assert.equal(countOccurrences(repaired.commentary, "350hp"), 1);
  });

  it("replaces beat-3 instead of appending when three paragraphs lack anchors", () => {
    const beat3 = `${strengthContext.replyClosingCue} ${strengthContext.closingBeatSecondLine}`;
    const reply = {
      commentary: "人體神殿段。\n\n載具映射段。\n\n通電完成，這組數據已寫入主機。",
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "",
    };

    const repaired = enforceCommentaryBeatContract(reply, strengthContext);
    assert.equal(repaired.commentary, `人體神殿段。\n\n載具映射段。\n\n${beat3}`);
    assert.equal(countOccurrences(repaired.commentary, "87.8"), 1);
    assert.equal(countOccurrences(repaired.commentary, "350hp"), 1);
    assert.doesNotMatch(repaired.commentary, /通電完成，這組數據已寫入主機。.*87\.8/);
  });

  it("collapses four paragraphs down to three beats and replaces weak tail with canonical beat-3", () => {
    const reply = {
      commentary: "第一段。\n\n第二段。\n\n第三段。\n\n第四段。",
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "",
    };

    const repaired = enforceCommentaryBeatContract(reply, methodologyContext);
    assert.equal(repaired.commentary.split(/\n\n+/).length, 3);
    assert.match(repaired.commentary, /評測頁面備有更完整的計分說明/);
    assert.doesNotMatch(repaired.commentary, /第四段/);
  });

  it("merges methodology nudge into last paragraph when gaps exist", () => {
    const reply = {
      commentary:
        "⚠️ [REMOTE ERROR]：行車電腦丟失 gripStrength 軸線的遙測數據。\n\n請完成握力通電測驗。",
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "gripStrength",
    };

    const repaired = enforceCommentaryBeatContract(reply, {
      ...methodologyContext,
      gaps: [{ axis: "gripStrength" }],
    });

    assert.match(repaired.commentary, /評測頁面備有更完整的計分說明/);
    assert.equal(repaired.commentary.split(/\n\n+/).length, 2);
  });
});
