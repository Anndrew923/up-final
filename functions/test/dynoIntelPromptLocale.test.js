import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolveDynoIntelPromptFile,
  stripTechnicalLeakage,
} from "../dynoIntel/gemini.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const promptsDir = join(__dirname, "..", "dynoIntel", "prompts");

describe("resolveDynoIntelPromptFile", () => {
  it("routes en locale to system_v1_en", () => {
    assert.equal(resolveDynoIntelPromptFile("system_v1", "en"), "system_v1_en");
  });

  it("routes zh-Hant locale to system_v1", () => {
    assert.equal(resolveDynoIntelPromptFile("system_v1", "zh-Hant"), "system_v1");
  });

  it("passes through custom prompt ids", () => {
    assert.equal(resolveDynoIntelPromptFile("custom_v2", "en"), "custom_v2");
  });
});

describe("system_v1_en prompt artifact", () => {
  it("contains the English off-topic fixed sentence template", () => {
    const text = readFileSync(join(promptsDir, "system_v1_en.txt"), "utf8");
    assert.match(
      text,
      /I am DYNO INTEL on this "Ultimate Physique" host\. I only decode your 6-axis telemetry, tier decode, and this App's scoring standard explanations\./
    );
  });

  it("defines v2.2 data resonance beat three without legend lore", () => {
    const text = readFileSync(join(promptsDir, "system_v1_en.txt"), "utf8");
    assert.match(text, /THREE-BEAT CONSTITUTION v2\.2/);
    assert.match(text, /Uplink Close · Data Resonance/);
    assert.match(text, /replyClosingCue/);
    assert.doesNotMatch(text, /Legend Analogy/);
    assert.doesNotMatch(text, /Weave \*\*checkable Olympia lore\*\*/);
  });

  it("defines human-to-machine three-beat constitution v2.2", () => {
    const text = readFileSync(join(promptsDir, "system_v1_en.txt"), "utf8");
    assert.match(text, /On this host's telemetry chassis, this force profile maps to a/);
    assert.doesNotMatch(text, /PROGRESSIVE DISCLOSURE/);
  });
});

describe("system_v1 prompt artifact", () => {
  it("defines 由人入機 three-beat constitution v2.2", () => {
    const text = readFileSync(join(promptsDir, "system_v1.txt"), "utf8");
    assert.match(text, /【由人入機】三段憲法 v2\.2/);
    assert.match(text, /第三段【通電收束 · 數據共鳴】/);
    assert.match(text, /在《最強肉體》主機的遙測底盤中，這份力量天賦被精準類比為/);
    assert.doesNotMatch(text, /PROGRESSIVE DISCLOSURE/);
  });

  it("retires legend analogies and requires replyClosingCue", () => {
    const text = readFileSync(join(promptsDir, "system_v1.txt"), "utf8");
    assert.match(text, /replyClosingCue/);
    assert.match(text, /assessmentDeepDiveNudge/);
    assert.match(text, /通電收束 · 數據共鳴/);
    assert.doesNotMatch(text, /奧林匹亞傳奇/);
    assert.doesNotMatch(text, /傳奇類比與鋼鐵意志/);
  });
});

describe("stripTechnicalLeakage locale routing", () => {
  it("uses English product language when locale is en", () => {
    assert.equal(
      stripTechnicalLeakage("cardCopy and tierBandId in JSON", "en"),
      "tier decode and tier in telemetry data"
    );
    assert.equal(
      stripTechnicalLeakage("scoringMethodologyBriefs", "en"),
      "scoring methodology briefs"
    );
    assert.equal(stripTechnicalLeakage("replyClosingCue", "en"), "uplink close cue");
  });

  it("uses zh-Hant product language by default", () => {
    assert.equal(stripTechnicalLeakage("cardCopy", "zh-Hant"), "級距解碼");
    assert.equal(
      stripTechnicalLeakage("scoringMethodologyBriefs", "zh-Hant"),
      "給分標準說明"
    );
    assert.equal(stripTechnicalLeakage("replyClosingCue", "zh-Hant"), "通電收束");
  });
});
