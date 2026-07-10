import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DYNO_INTEL_HUMAN_SCALE_MATRIX_EN,
} from "../dynoIntel/dynoIntelHumanScaleMatrix.js";
import {
  containsVehicleLexicon,
  resolveHumanBrief,
  resolveHumanBriefPartsFromContext,
  resolvePrPercentileSegment,
  resolveSegment1Core,
  scrubVehicleLexicon,
  VEHICLE_LEXICON_REGEX,
} from "../dynoIntel/dynoIntelHumanBriefs.js";
import {
  assembleSingleBeatCommentary,
  buildOfficialHumanAnchor,
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

function splitParagraphs(text) {
  return String(text ?? "")
    .split(/\n\n+/)
    .map((row) => row.trim())
    .filter(Boolean);
}

function normalizeBriefWhitespace(text) {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

describe("dynoIntelHumanBriefs v3", () => {
  it("VEHICLE_LEXICON_REGEX flags vehicle metaphors", () => {
    assert.ok(containsVehicleLexicon("這台跑車的馬力輸出"));
    assert.ok(!containsVehicleLexicon("深蹲硬舉的募集水準"));
  });

  it("resolveHumanBrief returns pure human copy for status strength v5.0", () => {
    const brief = resolveHumanBrief(strengthStatusContext);
    assert.ok(brief);
    assert.ok(!containsVehicleLexicon(brief));
    assert.match(brief, /高階玩家/);
    assert.match(brief, /你把「訓練」的優先權/);
    assert.doesNotMatch(brief, /全人類官方 PR 值對照資料/);
    assert.doesNotMatch(brief, /業餘運動員頂尖|大重量|TIER_|Mock Neuro/);
  });

  it("v5.2 — segment1Core excludes PR viral copy", () => {
    const macroCtx = {
      locale: "zh-Hant",
      mode: "cross-axis",
      intent: "status",
      userQuestion: "我的總分表現如何？",
      gaps: [],
      overallScore: 92,
      axes: [{ axis: "strength", score: 90, tierBandId: "TIER_90", cardCopy: { title: "x", summary: "x" } }],
    };
    const core = resolveSegment1Core("overall", 92, "zh-Hant", macroCtx);
    assert.ok(core);
    assert.doesNotMatch(core, /PR|熱烈搜集中|嚴謹搜集中/);
    assert.match(core, /除非你是基因樂透得主/);
  });

  it("scrubVehicleLexicon strips blacklisted tokens", () => {
    const cleaned = scrubVehicleLexicon("馬力輸出與抓地力");
    assert.ok(!VEHICLE_LEXICON_REGEX.test(cleaned));
  });

  it("v5.0 — muscleMass 91.6 uses population class + volume soul praise (no tier tail)", () => {
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
    assert.match(brief, /凡人頂尖/);
    assert.match(brief, /無論基因如何，能到凡人頂尖/);
    assert.doesNotMatch(brief, /視覺天花板|量體飽滿|梯隊定位|Mock Volume/);
  });

  it("v5.0 — muscleMass 124.4 uses volume soul + international master population class", () => {
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
    assert.match(brief, /歷史級別/);
    assert.match(brief, /你的外型與身體機能/);
    assert.doesNotMatch(brief, /量體飽滿|Mock Volume/);
    const paragraphs = splitParagraphs(brief);
    const segment1 = paragraphs[0] ?? brief;
    assert.doesNotMatch(segment1, /肌纖維|量體飽滿|Mock Volume/);
    assert.ok(brief.endsWith("僅供天梯對帳與娛樂參考。"));
  });

  it("v5.0 — strength 87.9 uses neuro soul praise without tier tail or PR fallback", () => {
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
    assert.match(brief, /高階玩家/);
    assert.match(brief, /你把「訓練」的優先權/);
    assert.doesNotMatch(brief, /業餘運動員頂尖|大重量|全人類官方 PR/);
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
    assert.match(brief, /極致功能化的肉體/);
    assert.ok(!containsVehicleLexicon(brief));
  });

  it("v5.2 — overall macro golden three: PR in segment 2, segment1 PR-free", () => {
    const macroCtx = {
      locale: "zh-Hant",
      mode: "cross-axis",
      intent: "status",
      userQuestion: "我的總分表現如何？",
      gaps: [],
      overallScore: 92,
      axes: [{ axis: "strength", score: 90, tierBandId: "TIER_90", cardCopy: { title: "x", summary: "x" } }],
    };
    const parts = resolveHumanBriefPartsFromContext(macroCtx);
    assert.ok(parts);
    assert.doesNotMatch(parts.segment1Core, /PR|熱烈搜集中/);
    assert.match(parts.prSegment, /全人類官方 PR 值對照資料正在熱烈搜集中/);
    assert.match(parts.fullBrief, /除非你是基因樂透得主/);
    assert.doesNotMatch(parts.fullBrief, /無論基因如何，能夠到這個程度/);

    const paragraphs = splitParagraphs(parts.fullBrief);
    assert.ok(paragraphs.length >= 2);
    assert.doesNotMatch(paragraphs[0], /熱烈搜集中/);
    assert.match(paragraphs[1], /熱烈搜集中/);

    const microPr = resolvePrPercentileSegment("zh-Hant", false, macroCtx);
    assert.equal(microPr, null);
  });

  it("v5.0 — zh micro strength appends hall-of-fame names when matrix cell exists", () => {
    const ctx = {
      locale: "zh-Hant",
      mode: "cross-axis",
      intent: "status",
      userQuestion: "我的力量表現如何？",
      questionFocusAxis: "strength",
      gaps: [],
      axes: [{ axis: "strength", score: 87.8, tierBandId: "TIER_80", cardCopy: { title: "x", summary: "x" } }],
    };
    const brief = resolveHumanBrief(ctx);
    assert.match(brief, /在名人堂聖殿中/);
    assert.match(brief, /Jason Statham、Chris Hemsworth、Conor McGregor/);
  });

  it("v5.2 — legal shield is standalone segment 3 when hall-of-fame names render (60+)", () => {
    const ctx = {
      locale: "zh-Hant",
      mode: "cross-axis",
      intent: "status",
      userQuestion: "我的力量表現如何？",
      questionFocusAxis: "strength",
      gaps: [],
      axes: [{ axis: "strength", score: 87.8, tierBandId: "TIER_80", cardCopy: { title: "x", summary: "x" } }],
    };
    const parts = resolveHumanBriefPartsFromContext(ctx);
    assert.match(parts.legalSegment, /生涯巔峰狀態/);
    assert.match(parts.fullBrief, /僅供天梯對帳與娛樂參考/);
    const paragraphs = splitParagraphs(parts.fullBrief);
    assert.equal(paragraphs.length, 2);
    assert.ok(paragraphs[1].endsWith("僅供天梯對帳與娛樂參考。"));
    assert.doesNotMatch(paragraphs[0], /生涯巔峰狀態/);
  });

  it("v5.1 — scores below 60 omit legal shield even when praise renders", () => {
    const ctx = {
      locale: "zh-Hant",
      mode: "cross-axis",
      intent: "status",
      userQuestion: "我的力量表現如何？",
      questionFocusAxis: "strength",
      gaps: [],
      axes: [{ axis: "strength", score: 55, tierBandId: "TIER_50", cardCopy: { title: "x", summary: "x" } }],
    };
    const brief = resolveHumanBrief(ctx);
    assert.ok(brief);
    assert.doesNotMatch(brief, /生涯巔峰狀態|僅供天梯對帳與娛樂參考/);
    assert.doesNotMatch(brief, /名人堂/);
  });

  it("v5.1 — blank matrix cell omits hall-of-fame and legal shield (explosive 70 band)", () => {
    const ctx = {
      locale: "zh-Hant",
      mode: "cross-axis",
      intent: "status",
      userQuestion: "我的爆發力如何？",
      questionFocusAxis: "explosivePower",
      gaps: [],
      axes: [
        {
          axis: "explosivePower",
          score: 75,
          tierBandId: "TIER_70",
          cardCopy: { title: "x", summary: "x" },
        },
      ],
    };
    const brief = resolveHumanBrief(ctx);
    assert.ok(brief);
    assert.doesNotMatch(brief, /名人堂|生涯巔峰狀態/);
  });

  it("v5.2 — overall macro with blank overall cell keeps PR in segment 2 but omits legal shield", () => {
    const ctx = {
      locale: "zh-Hant",
      mode: "cross-axis",
      intent: "status",
      userQuestion: "我的總分表現如何？",
      gaps: [],
      overallScore: 155,
      axes: [{ axis: "strength", score: 150, tierBandId: "LEGEND", cardCopy: { title: "x", summary: "x" } }],
    };
    const parts = resolveHumanBriefPartsFromContext(ctx);
    assert.match(parts.prSegment, /全人類官方 PR 值對照資料正在熱烈搜集中/);
    assert.equal(parts.legalSegment, null);
    assert.doesNotMatch(parts.fullBrief, /名人堂|生涯巔峰狀態/);
    const paragraphs = splitParagraphs(parts.fullBrief);
    assert.ok(paragraphs.length >= 2);
    assert.doesNotMatch(paragraphs[0], /熱烈搜集中/);
    assert.match(paragraphs.slice(1).join(" "), /熱烈搜集中/);
  });

  it("v5.0 — beat repair preserves official tier-band phrases inside anchor (e.g. 80分)", () => {
    const ctx = {
      locale: "zh-Hant",
      mode: "cross-axis",
      intent: "status",
      userQuestion: "我的力量表現如何？",
      questionFocusAxis: "strength",
      gaps: [],
      axes: [{ axis: "strength", score: 87.8, tierBandId: "TIER_80", cardCopy: { title: "x", summary: "x" } }],
    };
    const fullBrief = resolveHumanBrief(ctx);
    const repaired = enforceCommentaryBeatContract(
      { commentary: `${fullBrief} 你的絕對力量表現已達 87.8 分。`, action_directive: "", is_off_topic: false },
      ctx
    );
    assert.match(repaired.commentary, /80\s*分以上/);
    assert.doesNotMatch(repaired.commentary, /87\.8\s*分/);
  });

  it("v5.2.2 — en locale micro strength appends hall-of-fame names when matrix cell exists", () => {
    const ctx = {
      locale: "en",
      mode: "cross-axis",
      intent: "status",
      userQuestion: "How is my strength?",
      questionFocusAxis: "strength",
      gaps: [],
      axes: [{ axis: "strength", score: 87.8, tierBandId: "TIER_80", cardCopy: { title: "x", summary: "x" } }],
    };
    const brief = resolveHumanBrief(ctx);
    assert.ok(brief);
    assert.match(brief, /Hall of Fame sanctum/i);
    assert.match(brief, /Jason Statham, Chris Hemsworth|Chris Hemsworth, Conor McGregor/);
    assert.doesNotMatch(brief, /、/);
    assert.doesNotMatch(brief, /[\u4e00-\u9fff]/);
  });

  it("v5.2.2 — en locale overall macro golden three with \\n\\n breathing room", () => {
    const macroCtx = {
      locale: "en",
      mode: "cross-axis",
      intent: "status",
      userQuestion: "How is my overall score?",
      gaps: [],
      overallScore: 92,
      axes: [{ axis: "strength", score: 90, tierBandId: "TIER_90", cardCopy: { title: "x", summary: "x" } }],
    };
    const parts = resolveHumanBriefPartsFromContext(macroCtx);
    assert.ok(parts);
    assert.doesNotMatch(parts.segment1Core, /Global Peer PR|career-peak states/i);
    assert.match(parts.prSegment, /Global Peer PR Percentile Data Is Actively Being Gathered/);
    assert.doesNotMatch(parts.fullBrief, /[\u4e00-\u9fff]/);

    const paragraphs = splitParagraphs(parts.fullBrief);
    assert.ok(paragraphs.length >= 2);
    assert.doesNotMatch(paragraphs[0], /Global Peer PR Percentile Data/i);
    assert.match(paragraphs[1], /Global Peer PR Percentile Data/i);
  });

  it("v5.3 — en total score macro triggers golden three with 100+ epic praise overlay", () => {
    const macroCtx = {
      locale: "en",
      mode: "cross-axis",
      intent: "status",
      userQuestion: "How is my total score?",
      gaps: [],
      overallScore: 105,
      axes: [{ axis: "strength", score: 100, tierBandId: "TIER_100", cardCopy: { title: "x", summary: "x" } }],
    };
    const parts = resolveHumanBriefPartsFromContext(macroCtx);
    assert.ok(parts);
    assert.match(parts.segment1Core, /Crossing 100 points|Mortal Awakening Tier/i);
    assert.match(parts.segment1Core, /Hall of Fame sanctum/i);
    assert.doesNotMatch(parts.segment1Core, /Global Peer PR|career-peak states/i);
    assert.match(parts.prSegment, /Global Peer PR Percentile Data Is Actively Being Gathered/);
    assert.match(parts.legalSegment, /career-peak states/);
    assert.doesNotMatch(parts.fullBrief, /[\u4e00-\u9fff]/);

    const paragraphs = splitParagraphs(parts.fullBrief);
    assert.equal(paragraphs.length, 3);
    assert.match(paragraphs[0], /Crossing 100 points|Mortal Awakening Tier/i);
    assert.match(paragraphs[1], /Global Peer PR Percentile Data/i);
    assert.ok(paragraphs[2].endsWith("entertainment purposes."));

    const repaired = enforceCommentaryBeatContract(
      {
        commentary: "Your aggregate output still has room to sharpen weak-axis synergy.",
        action_directive: "",
        is_off_topic: false,
        detected_weakest_axis: "",
      },
      macroCtx
    );
    const repairedParagraphs = splitParagraphs(repaired.commentary);
    assert.equal(repairedParagraphs.length, 3);
    assert.match(repairedParagraphs[0], /Crossing 100 points|Mortal Awakening Tier/i);
    assert.match(repairedParagraphs[1], /Global Peer PR Percentile Data/i);
    assert.match(repairedParagraphs[2], /entertainment purposes/);
    assert.doesNotMatch(repaired.commentary, /[\u4e00-\u9fff]/);
  });

  it("v5.3.1 — en 90-band overall macro uses epic praise parity (not short summaryHuman)", () => {
    const macroCtx = {
      locale: "en",
      mode: "cross-axis",
      intent: "status",
      userQuestion: "How is my total score?",
      gaps: [],
      overallScore: 92,
      axes: [{ axis: "strength", score: 90, tierBandId: "TIER_90", cardCopy: { title: "x", summary: "x" } }],
    };
    const parts = resolveHumanBriefPartsFromContext(macroCtx);
    assert.ok(parts);
    assert.match(parts.segment1Core, /genetic lottery|Peak Mortal Tier/i);
    assert.doesNotMatch(parts.segment1Core, /regional multi-event benchmark with excellent/i);
    assert.match(parts.prSegment, /Global Peer PR Percentile Data Is Actively Being Gathered/);
    assert.match(parts.legalSegment, /career-peak states/);
    assert.doesNotMatch(parts.fullBrief, /[\u4e00-\u9fff]/);
  });

  it("v5.2.2 — en locale legal shield is standalone segment 3 when hall-of-fame names render (60+)", () => {
    const ctx = {
      locale: "en",
      mode: "cross-axis",
      intent: "status",
      userQuestion: "How is my strength?",
      questionFocusAxis: "strength",
      gaps: [],
      axes: [{ axis: "strength", score: 87.8, tierBandId: "TIER_80", cardCopy: { title: "x", summary: "x" } }],
    };
    const parts = resolveHumanBriefPartsFromContext(ctx);
    assert.match(parts.legalSegment, /career-peak states/);
    assert.match(parts.fullBrief, /entertainment purposes/);
    const paragraphs = splitParagraphs(parts.fullBrief);
    assert.equal(paragraphs.length, 2);
    assert.ok(paragraphs[1].endsWith("entertainment purposes."));
    assert.doesNotMatch(paragraphs[0], /career-peak states/);
  });

  it("v5.2.1 — en locale segment1 has zero CJK pollution", () => {
    const ctx = {
      locale: "en",
      mode: "cross-axis",
      intent: "status",
      userQuestion: "How is my strength?",
      questionFocusAxis: "strength",
      gaps: [],
      axes: [{ axis: "strength", score: 87.8, tierBandId: "TIER_80", cardCopy: { title: "x", summary: "x" } }],
    };
    const segment1 = resolveSegment1Core("strength", 87.8, "en", ctx);
    const brief = resolveHumanBrief(ctx);
    assert.ok(segment1);
    assert.ok(brief);
    assert.doesNotMatch(segment1, /[\u4e00-\u9fff]/);
    assert.doesNotMatch(brief, /[\u4e00-\u9fff]/);
    assert.match(segment1, /maps to|Against same-age norms/i);
    assert.match(segment1, /Advanced Operator Tier/i);
    assert.match(
      segment1,
      /Against same-age competitive norms, your absolute strength performance maps to Advanced Operator Tier/
    );
    assert.doesNotMatch(segment1, /performance {2}maps/);
  });

  it("v5.2.1 — EN scale matrix build rows contain zero CJK", () => {
    for (const row of Object.values(DYNO_INTEL_HUMAN_SCALE_MATRIX_EN)) {
      const blob = `${row.populationClass} ${row.summaryHuman}`;
      assert.doesNotMatch(blob, /[\u4e00-\u9fff]/, `CJK leak in tier ${row.tierId}`);
    }
  });

  it("v5.3 — EN scale matrix 0–150 decades overlay epic praise (parity with zh-Hant)", () => {
    const row90 = DYNO_INTEL_HUMAN_SCALE_MATRIX_EN["90"];
    assert.match(row90.summaryHuman, /genetic lottery|Peak Mortal Tier/i);
    assert.ok(row90.summaryHuman.length > 120);
    const row100 = DYNO_INTEL_HUMAN_SCALE_MATRIX_EN["100"];
    assert.match(row100.summaryHuman, /Crossing 100 points|Mortal Awakening Tier/i);
    assert.ok(row100.summaryHuman.length > 120);
    const row0 = DYNO_INTEL_HUMAN_SCALE_MATRIX_EN["0"];
    assert.match(row0.summaryHuman, /Infant Phase Tier|enormous room to grow/i);
    assert.ok(row0.summaryHuman.length > 80);
  });
});

describe("enforceCommentaryBeatContract v3", () => {
  it("v5.2 — assembles status replies with golden segments (segment1 + legal when applicable)", () => {
    const reply = {
      commentary: "以健身房常模來看，你的大重量動作還有上升空間。",
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "strength",
    };
    const repaired = enforceCommentaryBeatContract(reply, strengthStatusContext);
    const paragraphs = splitParagraphs(repaired.commentary);
    assert.equal(paragraphs.length, 2);
    assert.ok(!/\d+(\.\d+)\s*分/.test(repaired.commentary));
    assert.ok(!containsVehicleLexicon(repaired.commentary));
    assert.ok(paragraphs[0].includes("同齡"));
    assert.doesNotMatch(paragraphs[0], /熱烈搜集中|生涯巔峰狀態/);
    assert.match(paragraphs[1], /生涯巔峰狀態/);
  });

  it("drops paraphrased AI extension and generic ritual closers (anchor-only)", () => {
    const fullBrief = resolveHumanBrief(strengthStatusContext);
    const segment1 = buildOfficialHumanAnchor(strengthStatusContext);
    const reply = {
      commentary: `${segment1}你把訓練的優先權排得很高，光去健身房擺樣子根本達不到目前程度，高階玩家就是這樣練出來的。下次請挑戰更全面的身體潛能，讓你的整體表現更上一層樓！`,
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "strength",
    };
    const repaired = enforceCommentaryBeatContract(reply, {
      ...strengthStatusContext,
      replyClosingCue: "力量停在 87.8 分——這份遙測主機已鎖定。",
      closingBeatSecondLine: "遙測已封存。下次通電時，帶著新的分數回來——我會在這裡等你。",
    });
    const paragraphs = splitParagraphs(repaired.commentary);
    assert.equal(paragraphs.length, 2);
    assert.equal(
      normalizeBriefWhitespace(paragraphs[0]),
      normalizeBriefWhitespace(segment1)
    );
    assert.match(paragraphs[1], /生涯巔峰狀態/);
    assert.ok(!repaired.commentary.includes("下次請挑戰"));
  });

  it("keeps one orthogonal extension sentence only when it adds a truly new angle", () => {
    const segment1 = buildOfficialHumanAnchor(strengthStatusContext);
    const reply = {
      commentary: `${segment1}若下一階要補齊，優先盯緊握力軸的穩定制動，硬拉終點才不會鬆掉。`,
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "strength",
    };
    const repaired = enforceCommentaryBeatContract(reply, strengthStatusContext);
    const paragraphs = splitParagraphs(repaired.commentary);
    assert.equal(paragraphs.length, 2);
    assert.ok(paragraphs[0].startsWith(segment1));
    assert.match(paragraphs[0], /握力軸|硬拉終點/);
    assert.match(paragraphs[1], /生涯巔峰狀態/);
  });

  it("injectChassisBeatsIntoContext exposes segment1 and trailing segments", () => {
    const enriched = injectChassisBeatsIntoContext(strengthStatusContext);
    assert.ok(enriched.chassisBeats?.summaryHuman);
    assert.ok(enriched.chassisBeats?.p1Official);
    assert.equal(enriched.chassisBeats.p1Official, buildOfficialHumanAnchor(strengthStatusContext));
    assert.ok(enriched.chassisBeats.legalSegment);
    assert.equal(enriched.chassisBeats.p2Official, undefined);
    assert.doesNotMatch(enriched.chassisBeats.p1Official, /熱烈搜集中/);
  });

  it("synthesizes gaps commentary from empty seed without Gemini", () => {
    const gapsContext = {
      ...strengthStatusContext,
      gaps: [{ axis: "gripStrength" }],
      assessmentDeepDiveNudge: "請先完成握力評測。",
    };
    const repaired = enforceCommentaryBeatContract(
      {
        commentary: "",
        action_directive: "",
        is_off_topic: false,
        detected_weakest_axis: "gripStrength",
      },
      gapsContext
    );
    assert.equal(splitParagraphs(repaired.commentary).length, 2);
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
    const paragraphs = splitParagraphs(repaired.commentary);
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
    const paragraphs = splitParagraphs(repaired.commentary);
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
    assert.equal(splitParagraphs(repaired.commentary).length, 1);
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
    assert.equal(splitParagraphs(repaired.commentary).length, 1);
    assert.doesNotMatch(repaired.commentary, /下列情境容易造成結果失真/);
    assert.match(repaired.commentary, /190|校正|健康教育/);
  });

  it("v3.1 prunes strength status synonym loops when anchor plus two short extensions repeat the same verdict", () => {
    const fullBrief = resolveHumanBrief(strengthStatusContext);
    const segment1 = buildOfficialHumanAnchor(strengthStatusContext);
    const reply = {
      commentary:
        segment1 +
        "力量評分，已達高階玩家頂尖強度。" +
        "你把訓練的優先權排在很多事情前面，光去健身房擺樣子根本達不到目前程度。",
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: "strength",
    };
    const repaired = enforceCommentaryBeatContract(reply, strengthStatusContext);
    const paragraphs = splitParagraphs(repaired.commentary);
    assert.equal(paragraphs.length, 2);
    assert.equal(normalizeBriefWhitespace(paragraphs[0]), normalizeBriefWhitespace(segment1));
    assert.equal(normalizeBriefWhitespace(paragraphs[1]), normalizeBriefWhitespace(splitParagraphs(fullBrief)[1]));
    assert.doesNotMatch(paragraphs[0], /力量評分，已達高階玩家頂尖強度/);
    assert.doesNotMatch(paragraphs[0], /光去健身房擺樣子根本達不到目前程度。$/);
    assert.match(paragraphs[0], /高階玩家/);
    assert.match(paragraphs[0], /你把「訓練」的優先權/);
  });

  it("v5.2 — heals stale single-paragraph cache without duplicating PR or legal segments", () => {
    const fullBrief = resolveHumanBrief(strengthStatusContext);
    const staleWall = fullBrief.replace(/\n\n+/g, "");
    const repaired = enforceCommentaryBeatContract(
      { commentary: staleWall, action_directive: "", is_off_topic: false, detected_weakest_axis: "strength" },
      strengthStatusContext
    );
    const paragraphs = splitParagraphs(repaired.commentary);
    assert.equal(paragraphs.length, 2);
    assert.doesNotMatch(paragraphs[0], /熱烈搜集中|生涯巔峰狀態/);
    assert.equal((repaired.commentary.match(/生涯巔峰狀態/g) ?? []).length, 1);
    assert.equal(
      normalizeBriefWhitespace(repaired.commentary),
      normalizeBriefWhitespace(fullBrief)
    );
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
