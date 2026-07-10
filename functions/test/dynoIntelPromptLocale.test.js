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
  it("defines v5.2 golden three-segment AI contract", () => {
    const text = readFileSync(join(promptsDir, "system_v1_en.txt"), "utf8");
    assert.match(text, /v5\.2 Golden Three-Paragraph UX Contract/i);
    assert.match(text, /forbidden from outputting `\\n\\n`/i);
    assert.match(text, /Segment 2 \(PR percentile viral-growth copy\) and Segment 3 \(legal disclaimer shield\)/i);
  });

  it("defines v3.0.4 semantic compression steel coach role", () => {
    const text = readFileSync(join(promptsDir, "system_v1_en.txt"), "utf8");
    assert.match(text, /v3\.0\.4/i);
    assert.match(text, /De-fat prose mandate/i);
    assert.match(text, /Active pruning authority/i);
    assert.doesNotMatch(text, /p2Official/);
  });

  it("keeps gaps, methodology, and hall-of-fame consult routing", () => {
    const text = readFileSync(join(promptsDir, "system_v1_en.txt"), "utf8");
    assert.match(text, /GAPS/i);
    assert.match(text, /SCORING_METHODOLOGY/i);
    assert.match(text, /HALL_OF_FAME_CONSULT/i);
    assert.match(text, /OFF-TOPIC/i);
    assert.match(text, /BOUNDARY_LOCK/i);
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

  it("defines v5.2 golden three-segment AI contract", () => {
    const text = readFileSync(join(promptsDir, "system_v1.txt"), "utf8");
    assert.match(text, /v5\.2 黃金三段式分工/);
    assert.match(text, /禁止自行輸出 `\\n\\n`/);
    assert.match(text, /第 2 段（PR 拉新召喚）與第 3 段（法律免責聖盾）將由系統後端硬貼焊接/);
  });

  it("adds hall-of-fame consult unlock rail", () => {
    const text = readFileSync(join(promptsDir, "system_v1.txt"), "utf8");
    assert.match(text, /HALL_OF_FAME_CONSULT/);
    assert.match(text, /後端硬閘門優先/);
    assert.match(text, /嚴禁自行列舉/);
    assert.doesNotMatch(text, /context\.hallOfFameConsult/);
  });

  it("adds BOUNDARY_LOCK prescription ban", () => {
    const text = readFileSync(join(promptsDir, "system_v1.txt"), "utf8");
    assert.match(text, /BOUNDARY_LOCK/);
    assert.match(text, /訓練課表|私人教練/);
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
