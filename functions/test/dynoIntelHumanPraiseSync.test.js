import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DYNO_INTEL_HALL_OF_FAME_LEGAL_SHIELD_ZH,
  DYNO_INTEL_HALL_OF_FAME_SENTENCE_ZH,
  DYNO_INTEL_PR_PERCENTILE_FALLBACK_ZH,
} from "../dynoIntel/dynoIntelHumanPraise.data.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const dynoIntelPath = join(root, "src/i18n/locales/zh-Hant/common/dynoIntel.json");

function loadDynoIntelI18n() {
  return JSON.parse(readFileSync(dynoIntelPath, "utf8")).dynoIntel;
}

describe("dynoIntelHumanPraise sync parity", () => {
  it("mirrors humanBrief + hallOfFame keys from zh-Hant dynoIntel.json", () => {
    const doc = loadDynoIntelI18n();
    assert.equal(DYNO_INTEL_PR_PERCENTILE_FALLBACK_ZH, doc.humanBrief.prPercentileFallback);
    assert.equal(DYNO_INTEL_HALL_OF_FAME_SENTENCE_ZH, doc.humanBrief.hallOfFameSentence);
    assert.equal(DYNO_INTEL_HALL_OF_FAME_LEGAL_SHIELD_ZH, doc.hallOfFame.legalShield);
    assert.match(doc.hallOfFame.legalShield, /生涯巔峰狀態/);
    assert.match(doc.hallOfFame.legalShield, /僅供天梯對帳與娛樂參考。$/);
  });
});
