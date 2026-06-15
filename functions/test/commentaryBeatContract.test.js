import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  beat3FeatureAnchorsPresent,
  enforceCommentaryBeatContract,
  endsWithOpenClause,
  extractBeat3FeatureAnchors,
  synthesizeHumanBeatFromCardCopy,
  synthesizeVehicleBeatFromContext,
  vehicleBeatNeedsCanonicalReplace,
} from "../dynoIntel/commentaryBeatContract.js";
import { finalizeDynoIntelReply, stripTechnicalLeakage } from "../dynoIntel/gemini.js";

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

const gripPerformanceContext = {
  gaps: [],
  closingBeatKind: "return-ritual",
  focusAxis: "gripStrength",
  questionFocusAxis: "gripStrength",
  replyClosingCue:
    "握力 / 抓地 停在 98.4 分，級距【競技級熱熔極限胎】——這份遙測主機已鎖定，值得你下次通電再對照。",
  closingBeatSecondLine: "遙測已封存。下次通電時，帶著新的分數回來——我會在這裡等你。",
  axes: [
    {
      axis: "gripStrength",
      score: 98.4,
      tierBandId: "TIER_130",
      cardCopy: { title: "競技級熱熔極限胎", summary: "業餘頂規抓地輸出。" },
    },
  ],
};

function countOccurrences(haystack, needle) {
  return haystack.split(needle).length - 1;
}

function countScoreMentions(haystack, score) {
  const escaped = score.replace(".", "\\.");
  return (haystack.match(new RegExp(`${escaped}\\s*分`, "g")) ?? []).length;
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
    const parts = repaired.commentary.split(/\n\n+/);
    assert.equal(parts.length, 3);
    assert.match(parts[2], /87\.8 分/);
    assert.match(parts[2], /保持這股鋼鐵意志/);
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

  it("merges orphan fragment paragraphs like「本」into neighbors", () => {
    const reply = {
      commentary:
        "神經肌肉募集與骨骼肌協同決定握力輸出上限。\n\n本\n\n在《最強肉體》主機的遙測底盤中，這份力量天賦被精準類比為煞車抓地頻譜的輸出。\n\n第四段冗餘。",
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "",
    };

    const repaired = enforceCommentaryBeatContract(reply, gripPerformanceContext);
    const parts = repaired.commentary.split(/\n\n+/);
    assert.equal(parts.length, 3);
    assert.doesNotMatch(repaired.commentary, /\n\n本\n\n/);
    assert.match(parts[0], /神經肌肉|骨骼肌/);
    assert.match(parts[1], /遙測底盤|煞車|抓地/);
    assert.match(parts[2], /98\.4 分/);
    assert.match(parts[2], /競技級熱熔極限胎/);
  });

  it("strips beat-3 score leaks from paragraph 2 and keeps canonical close once", () => {
    const leakedBeat3 =
      "握力 / 抓地 停在 98.4 分，級距【競技級熱熔極限胎】——這份遙測主機已鎖定，值得你下次通電再對照。";
    const reply = {
      commentary: `神經肌肉募集決定握力輸出。\n\n在《最強肉體》主機的遙測底盤中，這份力量天賦被精準類比為煞車抓地頻譜的輸出。${leakedBeat3}\n\n遙測已封存。`,
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "",
    };

    const repaired = enforceCommentaryBeatContract(reply, gripPerformanceContext);
    const parts = repaired.commentary.split(/\n\n+/);
    assert.equal(parts.length, 3);
    assert.doesNotMatch(parts[1], /98\.4 分/);
    assert.doesNotMatch(parts[1], /遙測主機已鎖定/);
    assert.equal(countScoreMentions(repaired.commentary, "98.4"), 1);
    assert.match(parts[2], /競技級熱熔極限胎/);
  });

  it("swaps beats when paragraph 1 is vehicle and paragraph 2 is human science", () => {
    const reply = {
      commentary:
        "在《最強肉體》主機的遙測底盤中，這份力量天賦被精準類比為煞車抓地頻譜的輸出。\n\n神經肌肉募集與骨骼肌協同決定握力輸出上限。",
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "",
    };

    const repaired = enforceCommentaryBeatContract(reply, gripPerformanceContext);
    const parts = repaired.commentary.split(/\n\n+/);
    assert.match(parts[0], /神經肌肉|骨骼肌/);
    assert.match(parts[1], /遙測底盤|煞車|抓地/);
    assert.match(parts[2], /98\.4 分/);
  });

  it("repairs vehicle-first body with score shard into human-vehicle-beat3 order", () => {
    const beat3 = `${gripPerformanceContext.replyClosingCue} ${gripPerformanceContext.closingBeatSecondLine}`;
    const reply = {
      commentary: `在《最強肉體》主機的遙測底盤中，這份握力天賦被精準類比為競技級熱熔極限胎的輸出。\n\n您的握力分數為 98.4 分，已突破業餘天花板\n\n${beat3}`,
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "",
    };

    const repaired = enforceCommentaryBeatContract(reply, gripPerformanceContext);
    const parts = repaired.commentary.split(/\n\n+/);
    assert.equal(parts.length, 3);
    assert.match(parts[0], /競技級熱熔極限胎|神經肌肉|常模/);
    assert.doesNotMatch(parts[0], /遙測底盤/);
    assert.match(parts[1], /遙測底盤|熱熔/);
    assert.doesNotMatch(parts[1], /98\.4 分/);
    assert.match(parts[2], /98\.4 分/);
    assert.doesNotMatch(parts[1], /已突破業餘天花板/);
    assert.equal(countScoreMentions(repaired.commentary, "98.4"), 1);
  });

  it("dedupes twin synthesized paragraphs from screenshot regression", () => {
    const twin = synthesizeHumanBeatFromCardCopy(gripPerformanceContext);
    const beat3 = `${gripPerformanceContext.replyClosingCue} ${gripPerformanceContext.closingBeatSecondLine}`;
    const reply = {
      commentary: `${twin}\n\n${twin}\n\n${gripPerformanceContext.replyClosingCue}`,
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "",
    };

    const repaired = enforceCommentaryBeatContract(reply, {
      ...gripPerformanceContext,
      intent: "status",
    });
    const parts = repaired.commentary.split(/\n\n+/);
    assert.equal(parts.length, 3);
    assert.notEqual(parts[0], parts[1]);
    assert.doesNotMatch(parts[0], /輪胎|遙測底盤/);
    assert.match(parts[1], /遙測底盤/);
    assert.match(parts[2], /遙測已封存|下次通電/);
    assert.equal(countScoreMentions(repaired.commentary, "98.4"), 1);
  });

  it("replaces truncated vehicle beat ending on open clause with canonical synthesis", () => {
    const human =
      "你的握力表現，展現了手部與前臂肌肉群的極致募集能力與肌腱韌性。這份力量能確保你在高強度負重下，依然維持穩固的抓握與精準的動作控制。這已達到競技運動員對抗重力、掌控器械的頂尖水平。";
    const truncatedVehicle =
      "在遙測底盤中，你的握力被映射為【競技級熱熔極限胎】。這意味著你的";
    const beat3 = `${gripPerformanceContext.replyClosingCue} ${gripPerformanceContext.closingBeatSecondLine}`;
    const reply = {
      commentary: `${human}\n\n${truncatedVehicle}\n\n${beat3}`,
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "",
    };

    assert.equal(endsWithOpenClause(truncatedVehicle), true);
    assert.equal(vehicleBeatNeedsCanonicalReplace(truncatedVehicle, gripPerformanceContext), true);

    const repaired = enforceCommentaryBeatContract(reply, {
      ...gripPerformanceContext,
      intent: "status",
    });
    const parts = repaired.commentary.split(/\n\n+/);
    assert.equal(parts.length, 3);
    assert.match(parts[1], /在《最強肉體》主機的遙測底盤中/);
    assert.match(parts[1], /[。！？]$/);
    assert.doesNotMatch(parts[1], /這意味著你的$/);
    assert.equal(parts[1], synthesizeVehicleBeatFromContext(gripPerformanceContext));
  });

  it("replaces vehicle beat shard after beat-3 leak strip leaves open clause tail", () => {
    const human = "神經肌肉募集與骨骼肌協同決定握力輸出上限。";
    const leakedVehicle =
      "在遙測底盤中，你的握力被映射為【競技級熱熔極限胎】。這意味著你的握力 / 抓地 (gripStrength 軸分數) 停在 98.4 分，級距【競技級熱熔極限胎】——這份遙測主機已鎖定。";
    const beat3 = `${gripPerformanceContext.replyClosingCue} ${gripPerformanceContext.closingBeatSecondLine}`;
    const reply = {
      commentary: `${human}\n\n${leakedVehicle}\n\n${beat3}`,
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "",
    };

    const repaired = enforceCommentaryBeatContract(reply, {
      ...gripPerformanceContext,
      intent: "status",
    });
    const parts = repaired.commentary.split(/\n\n+/);
    assert.match(parts[1], /在《最強肉體》主機的遙測底盤中/);
    assert.match(parts[1], /[。！？]$/);
    assert.doesNotMatch(parts[1], /這意味著你的$/);
    assert.doesNotMatch(parts[2], /gripStrength/i);
  });

  it("strips axis camelCase leakage from beat-3 after contract post-sanitize", () => {
    const beat3Leak =
      "握力 / 抓地 (gripStrength 軸分數) 停在 98.4 分，級距【競技級熱熔極限胎】——這份遙測主機已鎖定，值得你下次通電再對照。 遙測已封存。下次通電時，帶著新的分數回來——我會在這裡等你。";
    const repaired = enforceCommentaryBeatContract(
      finalizeDynoIntelReply(
        {
          commentary: `人體段。\n\n載具段。\n\n${beat3Leak}`,
          action_directive: "",
          is_off_topic: false,
          detected_weakest_axis: "",
        },
        "zh-Hant"
      ),
      { ...gripPerformanceContext, intent: "status" }
    );
    const commentary = stripTechnicalLeakage(repaired.commentary, "zh-Hant").trim();
    assert.doesNotMatch(commentary, /gripStrength/i);
    assert.match(commentary, /握力 \/ 抓地/);
  });
});
