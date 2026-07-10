import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildGeminiInferencePayload } from "../dynoIntel/buildGeminiInferencePayload.js";
import {
  buildCoachingBoundaryReply,
  buildGapsSeedReply,
  DYNO_INTEL_COACHING_BOUNDARY_EN,
  DYNO_INTEL_COACHING_BOUNDARY_ZH,
  shouldPreemptCoaching,
} from "../dynoIntel/deterministicDynoIntelRoutes.js";
import { finalizeDynoIntelCallableReply } from "../dynoIntel/gemini.js";
import { injectChassisBeatsIntoContext } from "../dynoIntel/dynoIntelChassisFactory.js";
import {
  buildPreemptiveOffTopicReply,
  shouldPreemptOffTopic,
} from "../dynoIntel/offTopicPreempt.js";
import { resolveDynoQuestionIntent } from "../dynoIntel/resolveQuestionIntent.js";

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

describe("buildGeminiInferencePayload", () => {
  it("strips prSegment, legalSegment, and summaryHuman from chassisBeats", () => {
    const macroCtx = {
      locale: "zh-Hant",
      mode: "cross-axis",
      intent: "status",
      userQuestion: "我的總分表現如何？",
      gaps: [],
      overallScore: 92,
      axes: [{ axis: "strength", score: 90, tierBandId: "TIER_90", cardCopy: { title: "x", summary: "x" } }],
    };
    const enriched = injectChassisBeatsIntoContext(macroCtx);
    assert.ok(enriched.chassisBeats?.p1Official);
    assert.ok(enriched.chassisBeats?.summaryHuman);

    const payload = buildGeminiInferencePayload(macroCtx);
    assert.ok(payload.chassisBeats?.p1Official);
    assert.equal(payload.chassisBeats.prSegment, undefined);
    assert.equal(payload.chassisBeats.legalSegment, undefined);
    assert.equal(payload.chassisBeats.summaryHuman, undefined);
  });

  it("omits chassisBeats when segment1 core is unavailable", () => {
    const payload = buildGeminiInferencePayload({
      locale: "zh-Hant",
      mode: "cross-axis",
      intent: "methodology",
      gaps: [{ axis: "gripStrength" }],
      axes: [],
    });
    assert.equal(payload.chassisBeats, undefined);
  });
});

describe("gaps deterministic zero-token route", () => {
  it("produces equivalent two-paragraph gaps commentary via finalize pipeline", () => {
    const gapsContext = {
      ...strengthStatusContext,
      gaps: [{ axis: "gripStrength" }],
      assessmentDeepDiveNudge: "請先完成握力評測——評測頁可展開完整計分說明。",
    };

    const fromSeed = finalizeDynoIntelCallableReply(
      buildGapsSeedReply(gapsContext),
      gapsContext,
      "握力盲區怎麼辦？"
    );

    const fromModelNoise = finalizeDynoIntelCallableReply(
      {
        commentary: "這是模型多餘輸出，應被 gaps contract 覆寫。",
        action_directive: "",
        is_off_topic: false,
        detected_weakest_axis: "gripStrength",
      },
      gapsContext,
      "握力盲區怎麼辦？"
    );

    assert.equal(fromSeed.commentary, fromModelNoise.commentary);
    const paragraphs = splitParagraphs(fromSeed.commentary);
    assert.equal(paragraphs.length, 2);
    assert.match(paragraphs[0], /REMOTE ERROR/);
    assert.match(paragraphs[0], /gripStrength/);
    assert.match(paragraphs[1], /握力/);
  });
});

describe("off-topic preemptive guard", () => {
  it("blocks clear trivia without axis or methodology signals", () => {
    assert.equal(
      shouldPreemptOffTopic("今晚吃什麼比較健康？", {
        locale: "zh-Hant",
        mode: "cross-axis",
        intent: "general",
        gaps: [],
        axes: [],
      }),
      true
    );
  });

  it("does not preempt FFMI or formula questions", () => {
    assert.equal(
      shouldPreemptOffTopic("FFMI 公式怎麼算？", {
        ...strengthStatusContext,
        intent: "methodology",
        questionFocusAxis: "bodyFat",
        scoringMethodologyBriefs: [
          { metric: "bodyFat", title: "FFMI", body: "以身高與去脂體重換算。" },
        ],
      }),
      false
    );
    assert.equal(
      shouldPreemptOffTopic("FFMI", {
        locale: "zh-Hant",
        mode: "cross-axis",
        intent: "methodology",
        questionFocusAxis: "bodyFat",
        gaps: [],
        axes: strengthStatusContext.axes,
      }),
      false
    );
    assert.equal(shouldPreemptOffTopic("我的力量表現如何？", strengthStatusContext), false);
  });

  it("builds fixed off-topic contract copy", () => {
    const reply = buildPreemptiveOffTopicReply("今晚吃什麼？", {
      locale: "zh-Hant",
      intent: "general",
      gaps: [],
    });
    assert.equal(reply.is_off_topic, true);
    assert.match(reply.commentary, /不在我的服務範圍內/);
    assert.match(reply.commentary, /今晚吃什麼/);
  });
});

describe("coaching-deterministic zero-token route", () => {
  it("classifies prescription asks as coaching", () => {
    assert.equal(resolveDynoQuestionIntent("我的力量要如何進步呢？"), "coaching");
    assert.equal(resolveDynoQuestionIntent("How can I improve my grip strength?"), "coaching");
    assert.equal(shouldPreemptCoaching("我的力量要如何進步呢？"), true);
  });

  it("returns Boss boundary copy verbatim through finalize", () => {
    const zhCtx = {
      ...strengthStatusContext,
      intent: "coaching",
      userQuestion: "我的力量要如何進步呢？",
    };
    const zhReply = finalizeDynoIntelCallableReply(
      buildCoachingBoundaryReply(zhCtx),
      zhCtx,
      "我的力量要如何進步呢？"
    );
    assert.equal(zhReply.commentary, DYNO_INTEL_COACHING_BOUNDARY_ZH);
    assert.equal(zhReply.is_off_topic, true);

    const enCtx = { ...zhCtx, locale: "en", intent: "coaching" };
    const enReply = finalizeDynoIntelCallableReply(
      buildCoachingBoundaryReply(enCtx),
      enCtx,
      "How can I improve my grip strength?"
    );
    assert.equal(enReply.commentary, DYNO_INTEL_COACHING_BOUNDARY_EN);
    assert.equal(enReply.is_off_topic, true);
  });

  it("preempts coaching even when context.intent is stale or spoofed", () => {
    assert.equal(
      shouldPreemptCoaching("我的力量要如何進步呢？", {
        ...strengthStatusContext,
        intent: "status",
      }),
      true
    );
  });

  it("does not pollute retrospective progress intent", () => {
    assert.equal(resolveDynoQuestionIntent("我有進步嗎？"), "progress");
    assert.equal(shouldPreemptCoaching("我有進步嗎？"), false);
  });
});
