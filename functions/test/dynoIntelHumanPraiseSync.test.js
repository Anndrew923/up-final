import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DYNO_INTEL_HALL_OF_FAME_BLOCKED_REPLY_EN,
  DYNO_INTEL_HALL_OF_FAME_BLOCKED_REPLY_ZH,
  DYNO_INTEL_HALL_OF_FAME_LEGAL_SHIELD_EN,
  DYNO_INTEL_HALL_OF_FAME_LEGAL_SHIELD_ZH,
  DYNO_INTEL_HALL_OF_FAME_SENTENCE_EN,
  DYNO_INTEL_HALL_OF_FAME_SENTENCE_ZH,
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
    assert.match(doc.hallOfFame.legalShield, /生涯巔峰狀態/);
    assert.match(doc.hallOfFame.legalShield, /僅供天梯對帳與娛樂參考。$/);
  });

  it("mirrors humanBrief + hallOfFame keys from en dynoIntel.json", () => {
    const doc = loadDynoIntelI18n(enDynoIntelPath);
    assert.equal(DYNO_INTEL_PR_PERCENTILE_FALLBACK_EN, doc.humanBrief.prPercentileFallback);
    assert.equal(DYNO_INTEL_HALL_OF_FAME_SENTENCE_EN, doc.humanBrief.hallOfFameSentence);
    assert.equal(DYNO_INTEL_HALL_OF_FAME_LEGAL_SHIELD_EN, doc.hallOfFame.legalShield);
    assert.equal(DYNO_INTEL_HALL_OF_FAME_BLOCKED_REPLY_EN, doc.hallOfFame.blockedReply);
    assert.match(doc.hallOfFame.legalShield, /career-peak states/);
    assert.match(doc.hallOfFame.legalShield, /entertainment purposes/);
    assert.doesNotMatch(doc.humanBrief.prPercentileFallback, /[\u4e00-\u9fff]/);
  });
});
