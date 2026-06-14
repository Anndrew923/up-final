import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { enforceCommentaryBeatContract } from "../dynoIntel/commentaryBeatContract.js";

const methodologyContext = {
  gaps: [],
  closingBeatKind: "methodology-nudge",
  replyClosingCue: "力量 / 馬力停在 87.9 分——這份遙測主機已鎖定，值得你下次通電再對照。",
  closingBeatSecondLine:
    "各評測頁面備有更完整的計分說明與常模解讀——請直接進入對應評測頁，展開說明區查閱全貌。",
};

describe("enforceCommentaryBeatContract", () => {
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
  });
});
