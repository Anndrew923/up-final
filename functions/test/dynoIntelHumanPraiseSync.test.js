import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DYNO_INTEL_HALL_OF_FAME_BLOCKED_REPLY_EN,
  DYNO_INTEL_HALL_OF_FAME_BLOCKED_REPLY_ZH,
  DYNO_INTEL_HALL_OF_FAME_GUIDED_REPLY_EN,
  DYNO_INTEL_HALL_OF_FAME_GUIDED_REPLY_ZH,
  DYNO_INTEL_HALL_OF_FAME_LEGAL_SHIELD_EN,
  DYNO_INTEL_HALL_OF_FAME_LEGAL_SHIELD_ZH,
  DYNO_INTEL_HALL_OF_FAME_SENTENCE_EN,
  DYNO_INTEL_HALL_OF_FAME_SENTENCE_ZH,
  DYNO_INTEL_HUMAN_PRAISE_BY_DECADE,
  DYNO_INTEL_HUMAN_PRAISE_BY_DECADE_EN,
  DYNO_INTEL_PR_PERCENTILE_FALLBACK_EN,
  DYNO_INTEL_PR_PERCENTILE_FALLBACK_ZH,
} from "../dynoIntel/dynoIntelHumanPraise.data.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const zhDynoIntelPath = join(root, "src/i18n/locales/zh-Hant/common/dynoIntel.json");
const enDynoIntelPath = join(root, "src/i18n/locales/en/common/dynoIntel.json");

function loadDynoIntelI18n(localePath) {
  return JSON.parse(readFileSync(localePath, "utf8")).dynoIntel;
}

describe("dynoIntelHumanPraise sync parity", () => {
  it("mirrors humanBrief + hallOfFame keys from zh-Hant dynoIntel.json", () => {
    const doc = loadDynoIntelI18n(zhDynoIntelPath);
    assert.equal(DYNO_INTEL_PR_PERCENTILE_FALLBACK_ZH, doc.humanBrief.prPercentileFallback);
    assert.equal(DYNO_INTEL_HALL_OF_FAME_SENTENCE_ZH, doc.humanBrief.hallOfFameSentence);
    assert.equal(DYNO_INTEL_HALL_OF_FAME_LEGAL_SHIELD_ZH, doc.hallOfFame.legalShield);
    assert.equal(DYNO_INTEL_HALL_OF_FAME_BLOCKED_REPLY_ZH, doc.hallOfFame.blockedReply);
    assert.equal(DYNO_INTEL_HALL_OF_FAME_GUIDED_REPLY_ZH, doc.hallOfFame.guidedReply);
    assert.match(doc.hallOfFame.legalShield, /生涯巔峰狀態/);
    assert.match(doc.hallOfFame.guidedReply, /爆發力 120 分還有誰/);
    assert.match(doc.hallOfFame.legalShield, /僅供天梯對帳與娛樂參考。$/);
  });

  it("mirrors humanBrief + hallOfFame keys from en dynoIntel.json", () => {
    const doc = loadDynoIntelI18n(enDynoIntelPath);
    assert.equal(DYNO_INTEL_PR_PERCENTILE_FALLBACK_EN, doc.humanBrief.prPercentileFallback);
    assert.equal(DYNO_INTEL_HALL_OF_FAME_SENTENCE_EN, doc.humanBrief.hallOfFameSentence);
    assert.equal(DYNO_INTEL_HALL_OF_FAME_LEGAL_SHIELD_EN, doc.hallOfFame.legalShield);
    assert.equal(DYNO_INTEL_HALL_OF_FAME_BLOCKED_REPLY_EN, doc.hallOfFame.blockedReply);
    assert.equal(DYNO_INTEL_HALL_OF_FAME_GUIDED_REPLY_EN, doc.hallOfFame.guidedReply);
    assert.match(doc.hallOfFame.legalShield, /career-peak states/);
    assert.match(doc.hallOfFame.guidedReply, /120 explosive power/i);
    assert.match(doc.hallOfFame.legalShield, /entertainment purposes/);
    assert.doesNotMatch(doc.humanBrief.prPercentileFallback, /[\u4e00-\u9fff]/);
    assert.doesNotMatch(doc.hallOfFame.guidedReply, /[\u4e00-\u9fff]/);
  });

  it("mirrors humanPraise.byDecade decade keys from zh-Hant and en dynoIntel.json", () => {
    const zh = loadDynoIntelI18n(zhDynoIntelPath);
    const en = loadDynoIntelI18n(enDynoIntelPath);
    const decades = ["0", "40", "50", "60", "70", "80", "90", "100", "110", "120", "130", "140", "150"];
    for (const decade of decades) {
      assert.ok(zh.humanPraise.byDecade[decade], `zh missing decade ${decade}`);
      assert.ok(en.humanPraise.byDecade[decade], `en missing decade ${decade}`);
      assert.equal(Object.keys(DYNO_INTEL_HUMAN_PRAISE_BY_DECADE[decade]).sort().join(","), "neuro,overall,populationClass,volume");
      assert.equal(Object.keys(DYNO_INTEL_HUMAN_PRAISE_BY_DECADE_EN[decade]).sort().join(","), "neuro,overall,populationClass,volume");
      for (const field of ["overall", "neuro", "volume", "populationClass"]) {
        assert.equal(
          DYNO_INTEL_HUMAN_PRAISE_BY_DECADE[decade][field],
          zh.humanPraise.byDecade[decade][field],
          `ZH gen drift ${decade}.${field}`
        );
        assert.equal(
          DYNO_INTEL_HUMAN_PRAISE_BY_DECADE_EN[decade][field],
          en.humanPraise.byDecade[decade][field],
          `EN gen drift ${decade}.${field}`
        );
        assert.doesNotMatch(String(DYNO_INTEL_HUMAN_PRAISE_BY_DECADE_EN[decade][field]), /[\u4e00-\u9fff]/);
      }
    }
  });

  it("locks zh humanPraise.byDecade to docs/data DynoIntel評語集合.txt (ws-normalized)", () => {
    const collectionPath = join(root, "docs/data/DynoIntel評語集合.txt");
    const src = readFileSync(collectionPath, "utf8");
    const zh = loadDynoIntelI18n(zhDynoIntelPath).humanPraise.byDecade;
    const decades = ["0", "40", "50", "60", "70", "80", "90", "100", "110", "120", "130", "140", "150"];

    const classByDecade = {
      0: "嬰兒期",
      40: "探索期",
      50: "新手村",
      60: "大眾健康常模",
      70: "進階訓練者",
      80: "高級玩家",
      90: "凡人頂尖",
      100: "凡體覺醒",
      110: "超凡入聖",
      120: "歷史級別",
      130: "統計神話",
      140: "怪物領域",
      150: "地表最強",
    };

    // WHY: Boss doc soft-wraps mid-paragraph with newlines; product copy hard-joins those wraps.
    const normalize = (value) =>
      String(value ?? "")
        .replace(/【全人類官方 PR[\s\S]*$/, "")
        .replace(/[\r\n]+/g, "")
        .replace(/[ \t\u00a0]+/g, " ")
        .trim();
    const pull = (kind) => {
      const re = {
        overall: /###\s*📊\s*【整體綜合總分 · 評語】\s*([\s\S]*?)(?=\n### |\n---|\n## |$)/g,
        neuro: /###\s*⚡\s*【神經募集流[^\n]*】\s*([\s\S]*?)(?=\n### |\n---|\n## |$)/g,
        volume: /###\s*🏎️\s*【時間容積流[^\n]*】\s*([\s\S]*?)(?=\n### |\n---|\n## |$)/g,
      }[kind];
      return [...src.matchAll(re)].map((match) => normalize(match[1]));
    };

    const overalls = pull("overall");
    const neuros = pull("neuro");
    const volumes = pull("volume");
    assert.equal(overalls.length, 13);
    assert.equal(neuros.length, 13);
    assert.equal(volumes.length, 13);

    for (let i = 0; i < decades.length; i += 1) {
      const decade = decades[i];
      assert.equal(zh[decade].populationClass, classByDecade[decade], `class ${decade}`);
      assert.equal(normalize(zh[decade].overall), overalls[i], `overall ${decade}`);
      assert.equal(normalize(zh[decade].neuro), neuros[i], `neuro ${decade}`);
      assert.equal(normalize(zh[decade].volume), volumes[i], `volume ${decade}`);
    }
  });
});
