import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  finalizeDynoIntelCallableReply,
  parseGeminiStructuredJson,
  salvagePartialGeminiReply,
} from "../dynoIntel/gemini.js";

describe("parseGeminiStructuredJson", () => {
  it("parses raw JSON", () => {
    assert.deepEqual(parseGeminiStructuredJson('{"commentary":"ok","action_directive":"go"}'), {
      commentary: "ok",
      action_directive: "go",
    });
  });

  it("parses fenced JSON", () => {
    const input = "```json\n{\"commentary\":\"ok\",\"action_directive\":\"go\"}\n```";
    assert.deepEqual(parseGeminiStructuredJson(input), {
      commentary: "ok",
      action_directive: "go",
    });
  });

  it("extracts JSON object from prefixed prose", () => {
    const input = 'Here is the payload:\n{"commentary":"ok","action_directive":"go"}';
    assert.deepEqual(parseGeminiStructuredJson(input), {
      commentary: "ok",
      action_directive: "go",
    });
  });

  it("returns null for non-json text", () => {
    assert.equal(parseGeminiStructuredJson("not json"), null);
  });
});

describe("salvagePartialGeminiReply", () => {
  const cardioContext = {
    locale: "zh-Hant",
    intent: "methodology",
    closingBeatKind: "methodology-nudge",
    questionFocusAxis: "cardio",
    scoringMethodologyBriefs: [
      {
        metric: "cardio",
        title: "心肺評測",
        body:
          "選擇測驗方式，計算後寫入心肺軸。\n\n本分數依首頁身體資料的性別與年齡組，對照常模距離表換算：不同年齡組之 60 分／100 分門檻不同。",
      },
    ],
    gaps: [],
    axes: [],
  };

  it("recovers commentary from truncated JSON", () => {
    const truncated =
      '{"commentary":"你的 FFMI 分數落在 96 分，屬於頂規引擎排量區間。","action_directive":"維持';
    const salvaged = salvagePartialGeminiReply(truncated);
    assert.ok(salvaged);
    assert.match(salvaged.commentary, /FFMI/);
    assert.equal(salvaged.action_directive, "");
    assert.equal(salvaged.is_off_topic, false);
  });

  it("upgrades truncated methodology salvage to full catalog brief", () => {
    const truncated =
      '{"commentary":"心肺評測分數，是依據你選擇的測驗方式，結合首頁身體資料中的性別與年齡組，對照專屬常模距離表換算而來。由於不同年","action_directive":"';
    const salvaged = salvagePartialGeminiReply(truncated, "zh-Hant", cardioContext);
    assert.ok(salvaged);
    assert.match(salvaged.commentary, /年齡組/);
    assert.match(salvaged.commentary, /。$/);
    assert.doesNotMatch(salvaged.commentary, /由於不同年$/);
  });

  it("returns null when no commentary field is present", () => {
    assert.equal(salvagePartialGeminiReply('{"action_directive":"go"}'), null);
  });
});

describe("finalizeDynoIntelCallableReply methodology completeness guard", () => {
  it("replaces incomplete parsed commentary with full brief before beat contract", () => {
    const context = {
      locale: "zh-Hant",
      intent: "methodology",
      closingBeatKind: "methodology-nudge",
      questionFocusAxis: "cardio",
      scoringMethodologyBriefs: [
        {
          metric: "cardio",
          title: "心肺評測",
          body: "選擇測驗方式，計算後寫入心肺軸。不同年齡組門檻不同，同一距離得分可能差異很大。",
        },
      ],
      gaps: [],
      axes: [],
    };
    const finalized = finalizeDynoIntelCallableReply(
      {
        commentary: "心肺評測分數，是依據你選擇的測驗方式，結合首頁身體資料中的性別與年齡組，對照專屬常模距離表換算而來。由於不同年",
        action_directive: "",
        is_off_topic: false,
        detected_weakest_axis: "cardio",
      },
      context,
      "心肺怎麼計分？"
    );
    assert.match(finalized.commentary, /年齡組/);
    assert.match(finalized.commentary, /。$/);
  });
});
