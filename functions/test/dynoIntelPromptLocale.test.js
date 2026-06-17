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
  it("defines v3.0.4 semantic compression steel coach role", () => {
    const text = readFileSync(join(promptsDir, "system_v1_en.txt"), "utf8");
    assert.match(text, /v3\.0\.4/i);
    assert.match(text, /De-fat prose mandate/i);
    assert.match(text, /Active pruning authority/i);
    assert.doesNotMatch(text, /p2Official/);
  });

  it("keeps gaps and methodology routing", () => {
    const text = readFileSync(join(promptsDir, "system_v1_en.txt"), "utf8");
    assert.match(text, /GAPS/i);
    assert.match(text, /SCORING_METHODOLOGY/i);
    assert.match(text, /OFF-TOPIC/i);
  });
});

describe("system_v1 prompt artifact", () => {
  it("defines v3.0.4 語意壓縮與文風去脂", () => {
    const text = readFileSync(join(promptsDir, "system_v1.txt"), "utf8");
    assert.match(text, /v3\.0\.4/);
    assert.match(text, /文筆去脂鐵律/);
    assert.match(text, /主動剪裁主權/);
    assert.doesNotMatch(text, /p2Official/);
  });

  it("retires multi-beat v2.5 constitution", () => {
    const text = readFileSync(join(promptsDir, "system_v1.txt"), "utf8");
    assert.doesNotMatch(text, /v2\.5 結構化分工/);
    assert.doesNotMatch(text, /第二段延伸：硬核機械動態/);
  });
});

describe("stripTechnicalLeakage locale routing", () => {
  it("uses English product language when locale is en", () => {
    assert.equal(
      stripTechnicalLeakage("cardCopy and tierBandId in JSON", "en"),
      "tier decode and tier in telemetry data"
    );
  });

  it("uses zh-Hant product language by default", () => {
    assert.equal(stripTechnicalLeakage("cardCopy", "zh-Hant"), "級距解碼");
  });
});
