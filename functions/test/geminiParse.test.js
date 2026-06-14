import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseGeminiStructuredJson, salvagePartialGeminiReply } from "../dynoIntel/gemini.js";

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
  it("recovers commentary from truncated JSON", () => {
    const truncated =
      '{"commentary":"你的 FFMI 分數落在 96 分，屬於頂規引擎排量區間。","action_directive":"維持';
    const salvaged = salvagePartialGeminiReply(truncated);
    assert.ok(salvaged);
    assert.match(salvaged.commentary, /FFMI/);
    assert.equal(salvaged.action_directive, "");
    assert.equal(salvaged.is_off_topic, false);
  });

  it("returns null when no commentary field is present", () => {
    assert.equal(salvagePartialGeminiReply('{"action_directive":"go"}'), null);
  });
});
