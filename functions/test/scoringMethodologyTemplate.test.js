import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildMethodologyTemplateReply,
  OVERALL_METHODOLOGY_TEMPLATE_EN,
  OVERALL_METHODOLOGY_TEMPLATE_ZH,
  shouldPreemptMethodology,
} from "../dynoIntel/scoringMethodologyTemplate.js";
import { resolveDynoIntelGeminiModel } from "../dynoIntel/resolveGeminiModel.js";
import { DYNO_INTEL_GEMINI_MODEL_LITE } from "../shared/constants.js";

describe("scoringMethodologyTemplate", () => {
  it("preempts explicit methodology questions", () => {
    assert.equal(shouldPreemptMethodology("力量怎麼算？"), true);
    assert.equal(shouldPreemptMethodology("How is grip score calculated?"), true);
    assert.equal(shouldPreemptMethodology("科學計分公式說明"), true);
  });

  it("does not preempt ordinary status reads", () => {
    assert.equal(shouldPreemptMethodology("我的力量表現如何？"), false);
    assert.equal(shouldPreemptMethodology("握力成績怎樣"), false);
  });

  it("builds axis brief when pruned briefs exist", () => {
    const reply = buildMethodologyTemplateReply({
      locale: "zh-Hant",
      intent: "methodology",
      questionFocusAxis: "strength",
      scoringMethodologyBriefs: [
        { metric: "strength", title: "力量計分", body: "以 DOTS 與 Brzycki 正規化後換算分數。" },
      ],
    });
    assert.match(reply.commentary, /DOTS/);
    assert.match(reply.commentary, /力量計分/);
  });

  it("falls back to overall template when no axis brief", () => {
    const zh = buildMethodologyTemplateReply({ locale: "zh-Hant", intent: "methodology" });
    const en = buildMethodologyTemplateReply({ locale: "en", intent: "methodology" });
    assert.equal(zh.commentary, OVERALL_METHODOLOGY_TEMPLATE_ZH);
    assert.equal(en.commentary, OVERALL_METHODOLOGY_TEMPLATE_EN);
  });

  it("keeps false-positive panel reads on lite (no flash escalate)", () => {
    assert.equal(resolveDynoIntelGeminiModel("我的握力分數代表什麼？"), DYNO_INTEL_GEMINI_MODEL_LITE);
    assert.equal(resolveDynoIntelGeminiModel("那我握力成績如何？"), DYNO_INTEL_GEMINI_MODEL_LITE);
  });
});
