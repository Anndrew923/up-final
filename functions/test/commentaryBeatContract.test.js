import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  containsVehicleLexicon,
  resolveHumanBrief,
  scrubVehicleLexicon,
  VEHICLE_LEXICON_REGEX,
} from "../dynoIntel/dynoIntelHumanBriefs.js";
import {
  assembleSingleBeatCommentary,
  injectChassisBeatsIntoContext,
} from "../dynoIntel/dynoIntelChassisFactory.js";
import { enforceCommentaryBeatContract } from "../dynoIntel/beatRepairPipeline.js";

const strengthStatusContext = {
  locale: "zh-Hant",
  mode: "cross-axis",
  intent: "status",
  closingBeatKind: "return-ritual",
  userQuestion: "我的力量表現如何？",
  questionFocusAxis: "strength",
  gaps: [],
  axes: [
    {
      axis: "strength",
      score: 87.8,
      tierBandId: "TIER_80",
      cardCopy: { title: "350hp雙門跑車", summary: "業餘運動員巔峰輸出。" },
    },
  ],
};

describe("dynoIntelHumanBriefs v3", () => {
  it("VEHICLE_LEXICON_REGEX flags vehicle metaphors", () => {
    assert.ok(containsVehicleLexicon("這台跑車的馬力輸出"));
    assert.ok(!containsVehicleLexicon("深蹲硬舉的募集水準"));
  });

  it("resolveHumanBrief returns pure human copy for status strength v3.5.1", () => {
    const brief = resolveHumanBrief(strengthStatusContext);
    assert.ok(brief);
    assert.ok(!containsVehicleLexicon(brief));
    assert.match(brief, /業餘運動員中優秀表現/);
    assert.match(brief, /\[Mock Neuro Male\]/);
    assert.doesNotMatch(brief, /業餘運動員頂尖|大重量|TIER_/);
  });

  it("scrubVehicleLexicon strips blacklisted tokens", () => {
    const cleaned = scrubVehicleLexicon("馬力輸出與抓地力");
    assert.ok(!VEHICLE_LEXICON_REGEX.test(cleaned));
  });

  it("v3.5.1 — muscleMass 91.6 uses population class + volume soul mock (no tier tail)", () => {
    const ctx = {
      locale: "zh-Hant",
      mode: "cross-axis",
      intent: "status",
      userQuestion: "我的肌肉量表現如何？",
      questionFocusAxis: "muscleMass",
      profile: { gender: "male" },
      gaps: [],
      axes: [{ axis: "muscleMass", score: 91.6, tierBandId: "TIER_90", cardCopy: { title: "競技級打孔寬體", summary: "x" } }],
    };
    const brief = resolveHumanBrief(ctx);
    assert.ok(brief);
    assert.match(brief, /地區型各類賽事常勝軍/);
    assert.match(brief, /\[Mock Volume Male\]/);
    assert.doesNotMatch(brief, /視覺天花板|量體飽滿|梯隊定位/);
  });

  it("v3.5.1 — muscleMass 124.4 uses volume soul + international master population class", () => {
    const ctx = {
      locale: "zh-Hant",
      mode: "cross-axis",
      intent: "status",
      userQuestion: "我的肌肉量表現如何？",
      questionFocusAxis: "muscleMass",
      profile: { gender: "female" },
      gaps: [],
      axes: [{ axis: "muscleMass", score: 124.4, tierBandId: "TIER_120", cardCopy: { title: "LMP", summary: "x" } }],
    };
    const brief = resolveHumanBrief(ctx);
    assert.match(brief, /國際大師級運動員/);
    assert.match(brief, /\[Mock Volume Female\]/);
    assert.doesNotMatch(brief, /肌纖維|量體飽滿/);
  });

  it("v3.5.1 — strength 87.9 uses neuro male mock without tier tail", () => {
    const ctx = {
      locale: "zh-Hant",
      mode: "cross-axis",
      intent: "status",
      userQuestion: "我的力量表現如何？",
      questionFocusAxis: "strength",
      gaps: [],
      axes: [{ axis: "strength", score: 87.9, tierBandId: "TIER_80", cardCopy: { title: "350hp", summary: "x" } }],
    };
    const brief = resolveHumanBrief(ctx);
    assert.match(brief, /業餘運動員中優秀表現/);
    assert.match(brief, /\[Mock Neuro Male\]/);
    assert.doesNotMatch(brief, /業餘運動員頂尖|大重量/);
  });

  it("resolveHumanBrief never returns vehicle lexicon even on fallback tiers", () => {
    const cardioContext = {
      locale: "zh-Hant",
      mode: "cross-axis",
      intent: "status",
      userQuestion: "我的心肺表現如何？",
      questionFocusAxis: "cardio",
      profile: { gender: "male" },
      gaps: [],
      axes: [{ axis: "cardio", score: 118, tierBandId: "TIER_110", cardCopy: { title: "長程續航引擎", summary: "x" } }],
    };
    const brief = resolveHumanBrief(cardioContext);
    assert.ok(brief);
    assert.match(brief, /\[Mock Volume Male\]/);
    assert.ok(!containsVehicleLexicon(brief));
  });
});

describe("enforceCommentaryBeatContract v3", () => {
  it("assembles status replies into a single paragraph without scores", () => {
    const reply = {
      commentary: "以健身房常模來看，你的大重量動作還有上升空間。",
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "strength",
    };
    const repaired = enforceCommentaryBeatContract(reply, strengthStatusContext);
    const paragraphs = repaired.commentary.split(/\n\n+/).filter(Boolean);
    assert.equal(paragraphs.length, 1);
    assert.ok(!/\d+(\.\d+)?\s*分/.test(repaired.commentary));
    assert.ok(!containsVehicleLexicon(repaired.commentary));
    assert.ok(repaired.commentary.includes("同齡"));
  });

  it("drops paraphrased AI extension and generic ritual closers (anchor-only)", () => {
    const anchor = resolveHumanBrief(strengthStatusContext);
    const reply = {
      commentary: `${anchor}你的多關節力量表現已達到業餘運動員的頂尖水準，深蹲、硬舉、臥推等大重量動作的肌群協同穩定性，非常接近競技舉重與健力選手的典型募集模式。下次請挑戰更全面的身體潛能，讓你的整體表現更上一層樓！`,
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "strength",
    };
    const repaired = enforceCommentaryBeatContract(reply, {
      ...strengthStatusContext,
      replyClosingCue: "力量停在 87.8 分——這份遙測主機已鎖定。",
      closingBeatSecondLine: "遙測已封存。下次通電時，帶著新的分數回來——我會在這裡等你。",
    });
    assert.equal(repaired.commentary, anchor);
    assert.ok(!repaired.commentary.includes("下次請挑戰"));
  });

  it("keeps one orthogonal extension sentence only when it adds a truly new angle", () => {
    const anchor = resolveHumanBrief(strengthStatusContext);
    const reply = {
      commentary: `${anchor}若下一階要補齊，優先盯緊握力軸的穩定制動，硬拉終點才不會鬆掉。`,
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "strength",
    };
    const repaired = enforceCommentaryBeatContract(reply, strengthStatusContext);
    const paragraphs = repaired.commentary.split(/\n\n+/).filter(Boolean);
    assert.equal(paragraphs.length, 1);
    // v3.1 允許保留這類真正正交的握力/硬拉線索；若未來被視為套娃而裁撤，至少保底 anchor 不變。
    assert.ok(repaired.commentary.startsWith(anchor));
  });

  it("injectChassisBeatsIntoContext exposes summaryHuman only", () => {
    const enriched = injectChassisBeatsIntoContext(strengthStatusContext);
    assert.ok(enriched.chassisBeats?.summaryHuman);
    assert.equal(enriched.chassisBeats.summaryHuman, enriched.chassisBeats.p1Official);
    assert.equal(enriched.chassisBeats.p2Official, undefined);
  });

  it("keeps gaps replies at two paragraphs", () => {
    const gapsContext = {
      ...strengthStatusContext,
      gaps: [{ axis: "gripStrength" }],
    };
    const reply = {
      commentary:
        "⚠️ [REMOTE ERROR]：行車電腦丟失 [gripStrength] 軸線的遙測數據，雷達圖底盤陷入失衡風險。\n\n請先完成握力評測。",
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "gripStrength",
    };
    const repaired = enforceCommentaryBeatContract(reply, gapsContext);
    const paragraphs = repaired.commentary.split(/\n\n+/).filter(Boolean);
    assert.equal(paragraphs.length, 2);
  });

  it("methodology replies collapse to one paragraph with brief anchor", () => {
    const methodologyContext = {
      locale: "zh-Hant",
      mode: "single-axis",
      intent: "methodology",
      closingBeatKind: "methodology-nudge",
      userQuestion: "本 App 力量怎麼計分？",
      questionFocusAxis: "strength",
      gaps: [],
      scoringMethodologyBriefs: [
        { metric: "strength", title: "力量計分", body: "本 App 以 Brzycki 與 IPF DOTS 綜合給分。" },
      ],
      axes: strengthStatusContext.axes,
    };
    const reply = {
      commentary: "簡單說就是公式換算你的最大出力。",
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "strength",
    };
    const repaired = enforceCommentaryBeatContract(reply, methodologyContext);
    const paragraphs = repaired.commentary.split(/\n\n+/).filter(Boolean);
    assert.equal(paragraphs.length, 1);
    assert.match(repaired.commentary, /Brzycki|IPF DOTS/);
  });

  it("v3.0.3 methodology locks grip brief when stale bodyFat focus lingers in context", () => {
    const methodologyContext = {
      locale: "zh-Hant",
      mode: "cross-axis",
      intent: "methodology",
      userQuestion: "握力怎麼評測的？",
      questionFocusAxis: "gripStrength",
      gaps: [],
      scoringMethodologyBriefs: [
        { metric: "gripStrength", title: "握力計分", body: "Captains of Crush 對照表換算握力分。" },
      ],
      axes: strengthStatusContext.axes,
    };
    const reply = {
      commentary: "DYNO INTEL 收到你的詢問。握力以 Captains of Crush 對照表換算。",
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "gripStrength",
    };
    const repaired = enforceCommentaryBeatContract(reply, methodologyContext);
    assert.equal(repaired.commentary.split(/\n\n+/).filter(Boolean).length, 1);
    assert.match(repaired.commentary, /Captains of Crush|握力計分/);
    assert.doesNotMatch(repaired.commentary, /收到你的詢問/);
    assert.doesNotMatch(repaired.commentary, /FFMI|體脂/);
  });

  it("v3.0.4 prunes FFMI synonym loops from live-style methodology paraphrase", () => {
    const methodologyContext = {
      locale: "zh-Hant",
      mode: "single-axis",
      intent: "methodology",
      userQuestion: "FFMI 怎麼評測？",
      questionFocusAxis: "bodyFat",
      gaps: [],
      scoringMethodologyBriefs: [
        {
          metric: "bodyFat",
          title: "FFMI 評測",
          body:
            "FFMI（無脂肪質量指數）在同身高下結合體脂，評估肌肉量表現，通常比單看 BMI 更有訓練參考意義；數值越高多半代表去脂體重相對較高。",
        },
      ],
      axes: strengthStatusContext.axes,
    };
    const looped =
      "FFMI 評測：FFMI（無脂肪質量指數）在同身高下結合體脂，評估肌肉量表現，通常比單看 BMI 更有訓練參考意義；數值越高多半代表去脂體重相對較高。" +
      "下列情境容易造成結果失真：FFMI，即無脂肪質量指數，是評估肌肉量的關鍵指標，它透過結合體脂與身高來提供比單純 BMI 更具實戰意義的訓練參考，數值越高通常代表去脂體重表現更為優異。" +
      "身高超過 190 公分時，系統會套用校正以維持準確度；結果僅供健康教育與同齡比較，非醫療診斷。";
    const reply = {
      commentary: looped,
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "bodyFat",
    };
    const repaired = enforceCommentaryBeatContract(reply, methodologyContext);
    assert.equal(repaired.commentary.split(/\n\n+/).filter(Boolean).length, 1);
    assert.doesNotMatch(repaired.commentary, /下列情境容易造成結果失真/);
    assert.match(repaired.commentary, /190|校正|健康教育/);
  });

  it("v3.1 prunes strength status synonym loops when anchor plus two short extensions repeat the same verdict", () => {
    const anchor = resolveHumanBrief(strengthStatusContext);
    const reply = {
      commentary:
        anchor +
        "力量評分，已達業餘運動員頂尖強度。" +
        "你的多關節力量表現，顯示肌群協同穩定，足以應付多數專項運動挑戰，逼近競技層級。",
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "strength",
    };
    const repaired = enforceCommentaryBeatContract(reply, strengthStatusContext);
    const paragraphs = repaired.commentary.split(/\n\n+/).filter(Boolean);
    assert.equal(paragraphs.length, 1);
    assert.equal(repaired.commentary, anchor);
    assert.doesNotMatch(repaired.commentary, /力量評分，已達業餘運動員頂尖強度/);
    assert.doesNotMatch(repaired.commentary, /顯示肌群協同穩定/);
    assert.match(repaired.commentary, /業餘運動員中優秀表現/);
    assert.match(repaired.commentary, /\[Mock Neuro Male\]/);
  });
});

describe("assembleSingleBeatCommentary v3", () => {
  it("joins anchor and extension with terminal punctuation", () => {
    const merged = assembleSingleBeatCommentary(
      "你的握力在同齡梯隊中屬於高位。",
      "硬拉時把握把咬緊就是實戰。",
      "zh-Hant"
    );
    assert.equal(merged.split(/\n\n+/).length, 1);
    assert.ok(merged.endsWith("。"));
  });
});
