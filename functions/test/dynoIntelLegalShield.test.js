import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  attachLegalShieldSuffix,
  shouldAttachHallOfFameLegalShield,
} from "../dynoIntel/dynoIntelHumanBriefs.js";
import { DYNO_INTEL_HALL_OF_FAME_LEGAL_SHIELD_ZH } from "../dynoIntel/dynoIntelHumanPraise.data.js";

describe("dynoIntel legal shield v5.1", () => {
  it("shouldAttachHallOfFameLegalShield requires hall segment, zh locale, and score >= 60", () => {
    assert.equal(shouldAttachHallOfFameLegalShield(87, "在名人堂聖殿中…", "zh-Hant"), true);
    assert.equal(shouldAttachHallOfFameLegalShield(59.9, "在名人堂聖殿中…", "zh-Hant"), false);
    assert.equal(shouldAttachHallOfFameLegalShield(87, null, "zh-Hant"), false);
    assert.equal(shouldAttachHallOfFameLegalShield(87, "在名人堂聖殿中…", "en"), false);
  });

  it("attachLegalShieldSuffix appends canonical copy as a single tail sentence", () => {
    const base = "在名人堂聖殿中，你正與 A、B 站在同一個王座座標。";
    const out = attachLegalShieldSuffix(base, "zh-Hant");
    assert.ok(out?.endsWith("僅供天梯對帳與娛樂參考。"));
    assert.equal(out, `${base}${DYNO_INTEL_HALL_OF_FAME_LEGAL_SHIELD_ZH}`);
    assert.doesNotMatch(out, /\n/);
  });

  it("attachLegalShieldSuffix is a no-op for en locale", () => {
    const base = "Hall of fame anchor.";
    assert.equal(attachLegalShieldSuffix(base, "en"), base);
  });
});
