import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeDynoIntelQuestion } from "../dynoIntel/normalizeDynoIntelQuestion.js";
import { detectQuestionFocusAxis } from "../dynoIntel/resolveQuestionIntent.js";

describe("normalizeDynoIntelQuestion", () => {
  it("folds full-width Latin to half-width", () => {
    assert.equal(normalizeDynoIntelQuestion("ＦＦＭＩ"), "FFMI");
    assert.equal(normalizeDynoIntelQuestion("ＤＯＴＳ"), "DOTS");
  });

  it("collapses ideographic space and extra whitespace", () => {
    assert.equal(normalizeDynoIntelQuestion("　FFMI　怎麼計分　"), "FFMI 怎麼計分");
  });
});

describe("detectQuestionFocusAxis with normalized input", () => {
  it("maps full-width FFMI to bodyFat", () => {
    assert.equal(detectQuestionFocusAxis("ＦＦＭＩ"), "bodyFat");
  });
});
