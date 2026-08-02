import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildDynoQuestionFingerprint,
  DYNO_INTEL_QUESTION_DEBOUNCE_MS,
} from "../dynoIntel/questionDebounce.js";

describe("questionDebounce helpers", () => {
  it("fingerprints normalize to stable hashes", () => {
    assert.equal(
      buildDynoQuestionFingerprint("力量怎麼算？"),
      buildDynoQuestionFingerprint("力量怎麼算？")
    );
    assert.notEqual(
      buildDynoQuestionFingerprint("力量怎麼算？"),
      buildDynoQuestionFingerprint("握力怎麼算？")
    );
  });

  it("exports a 10s debounce window", () => {
    assert.equal(DYNO_INTEL_QUESTION_DEBOUNCE_MS, 10_000);
  });
});
