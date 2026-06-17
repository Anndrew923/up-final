import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { enforceCommentaryBeatContract } from "../dynoIntel/beatRepairPipeline.js";
import {
  capTextAtSentenceBoundary,
  ensureMethodologyCommentaryComplete,
  isMethodologyCommentaryComplete,
  METHODOLOGY_ANCHOR_MAX_CHARS,
  pruneSynonymLoopsInParagraph,
  repairMethodologyCommentary,
  resolveMethodologyBriefAnchor,
  resolveMethodologyFullBrief,
} from "../dynoIntel/methodologyBeatRepair.js";

const cardioBriefBody =
  "選擇測驗方式，計算後寫入心肺軸。\n\n" +
  "本分數依首頁身體資料的性別與年齡組，對照常模距離表換算：不同年齡組之 60 分／100 分門檻不同，同一距離在不同組別得分可能差異很大。介於表上 60 與 100 分錨點之間為線性內插；超過 100 分錨點可高於 100 分。須年滿 13 歲始有本表對照組。\n\n" +
  "快於 20:00 可超過 100 分；45:00 或更慢為 0。資料僅存本機。";

const cardioMethodologyContext = {
  locale: "zh-Hant",
  mode: "cross-axis",
  intent: "methodology",
  closingBeatKind: "methodology-nudge",
  userQuestion: "心肺評測分數怎麼算？",
  questionFocusAxis: "cardio",
  gaps: [],
  scoringMethodologyBriefs: [
    {
      metric: "cardio",
      title: "心肺評測",
      body: cardioBriefBody,
    },
  ],
  axes: [],
};

describe("capTextAtSentenceBoundary", () => {
  it("keeps short text unchanged", () => {
    const text = "選擇測驗方式，計算後寫入心肺軸。";
    assert.equal(capTextAtSentenceBoundary(text, 40, "zh-Hant"), text);
  });

  it("cuts at the last sentence stop within maxChars instead of mid-clause", () => {
    const long =
      "第一句完整說明心肺常模。第二句補充年齡組門檻與線性內插規則。第三句描述五公里與 Cooper 的差異與資料僅存本機。";
    const capped = capTextAtSentenceBoundary(long, 42, "zh-Hant");
    assert.match(capped, /。$/);
    assert.doesNotMatch(capped, /內插規則$/);
    assert.ok(capped.length <= 42);
  });
});

describe("isMethodologyCommentaryComplete", () => {
  it("rejects truncated mid-sentence cardio paraphrase", () => {
    assert.equal(
      isMethodologyCommentaryComplete(
        "心肺評測分數，是依據你選擇的測驗方式，結合首頁身體資料中的性別與年齡組，對照專屬常模距離表換算而來。由於不同年",
        "zh-Hant"
      ),
      false
    );
  });

  it("rejects single-character glitches", () => {
    assert.equal(isMethodologyCommentaryComplete("力", "zh-Hant"), false);
  });

  it("accepts complete methodology paragraphs", () => {
    assert.equal(
      isMethodologyCommentaryComplete(
        "心肺評測分數依首頁性別與年齡組對照常模距離表換算，不同年齡組門檻不同，同一距離得分可能差異很大。",
        "zh-Hant"
      ),
      true
    );
  });
});

describe("resolveMethodologyBriefAnchor v3.0.5", () => {
  it("does not hard-slice cardio anchor mid-clause at 180 chars", () => {
    const anchor = resolveMethodologyBriefAnchor(cardioMethodologyContext);
    assert.ok(anchor);
    assert.match(anchor, /心肺評測/);
    assert.ok(anchor.length <= METHODOLOGY_ANCHOR_MAX_CHARS + 4);
    assert.doesNotMatch(anchor, /由於不同年$/);
  });
});

describe("resolveMethodologyFullBrief", () => {
  it("returns collapsed catalog copy with title prefix", () => {
    const full = resolveMethodologyFullBrief(cardioMethodologyContext);
    assert.ok(full);
    assert.match(full, /心肺評測/);
    assert.match(full, /年齡組/);
    assert.match(full, /線性內插/);
    assert.match(full, /20:00/);
  });
});

describe("ensureMethodologyCommentaryComplete", () => {
  it("replaces truncated salvage with full brief", () => {
    const repaired = ensureMethodologyCommentaryComplete(
      "心肺評測分數，是依據你選擇的測驗方式，結合首頁身體資料中的性別與年齡組，對照專屬常模距離表換算而來。由於不同年",
      cardioMethodologyContext
    );
    assert.match(repaired, /年齡組/);
    assert.match(repaired, /線性內插|20:00/);
    assert.match(repaired, /。$/);
  });
});

describe("repairMethodologyCommentary v3.0.5", () => {
  it("upgrades truncated cardio model output to full catalog brief", () => {
    const reply = {
      commentary:
        "心肺評測分數，是依據你選擇的測驗方式，結合首頁身體資料中的性別與年齡組，對照專屬常模距離表換算而來。由於不同年",
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "cardio",
    };
    const repaired = repairMethodologyCommentary(reply, cardioMethodologyContext);
    assert.equal(repaired.commentary.split(/\n\n+/).filter(Boolean).length, 1);
    assert.match(repaired.commentary, /年齡組/);
    assert.match(repaired.commentary, /。$/);
    assert.doesNotMatch(repaired.commentary, /由於不同年$/);
  });

  it("upgrades single-character model glitches", () => {
    const strengthContext = {
      ...cardioMethodologyContext,
      questionFocusAxis: "strength",
      scoringMethodologyBriefs: [
        {
          metric: "strength",
          title: "計分說明",
          body: "每個完成的項目會先以 Brzycki 估計 1RM，再換算為 DOTS 系分數，並以年齡係數（McCulloch）修正。",
        },
      ],
    };
    const repaired = repairMethodologyCommentary(
      {
        commentary: "力",
        action_directive: "",
        is_off_topic: false,
        detected_weakest_axis: "strength",
      },
      strengthContext
    );
    assert.match(repaired.commentary, /Brzycki|DOTS/);
    assert.ok(repaired.commentary.length >= 40);
  });

  it("fills empty commentary from full brief", () => {
    const repaired = repairMethodologyCommentary(
      {
        commentary: "",
        action_directive: "",
        is_off_topic: false,
        detected_weakest_axis: "cardio",
      },
      cardioMethodologyContext
    );
    assert.match(repaired.commentary, /心肺評測/);
    assert.match(repaired.commentary, /年齡組/);
  });
});

describe("enforceCommentaryBeatContract methodology truncation guard", () => {
  it("repairs truncated methodology through beat contract entry", () => {
    const reply = {
      commentary:
        "心肺評測分數，是依據你選擇的測驗方式，結合首頁身體資料中的性別與年齡組，對照專屬常模距離表換算而來。由於不同年",
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "cardio",
    };
    const repaired = enforceCommentaryBeatContract(reply, cardioMethodologyContext);
    assert.match(repaired.commentary, /線性內插|20:00/);
    assert.match(repaired.commentary, /。$/);
  });
});

describe("pruneSynonymLoopsInParagraph v3.0.4", () => {
  it("drops near-duplicate FFMI definition clause", () => {
    const looped =
      "FFMI 評測：FFMI（無脂肪質量指數）在同身高下結合體脂，評估肌肉量表現，通常比單看 BMI 更有訓練參考意義；數值越高多半代表去脂體重相對較高。" +
      "下列情境容易造成結果失真：FFMI，即無脂肪質量指數，是評估肌肉量的關鍵指標，它透過結合體脂與身高來提供比單純 BMI 更具實戰意義的訓練參考，數值越高通常代表去脂體重表現更為優異。" +
      "身高超過 190 公分時，系統會套用校正以維持準確度。";
    const pruned = pruneSynonymLoopsInParagraph(looped);
    assert.doesNotMatch(pruned, /下列情境容易造成結果失真/);
    assert.match(pruned, /190|校正/);
    assert.match(pruned, /FFMI/);
  });
});
