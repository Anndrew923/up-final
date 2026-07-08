import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  attachLegalShieldSuffix,
  shouldAttachHallOfFameLegalShield,
} from "../dynoIntel/dynoIntelHumanBriefs.js";
import {
  DYNO_INTEL_HALL_OF_FAME_LEGAL_SHIELD_EN,
  DYNO_INTEL_HALL_OF_FAME_LEGAL_SHIELD_ZH,
} from "../dynoIntel/dynoIntelHumanPraise.data.js";

describe("dynoIntel legal shield v5.1", () => {
  it("shouldAttachHallOfFameLegalShield requires hall segment and score >= 60 for both locales", () => {
    assert.equal(shouldAttachHallOfFameLegalShield(87, "In the Hall of Fame sanctum…", "zh-Hant"), true);
    assert.equal(shouldAttachHallOfFameLegalShield(87, "In the Hall of Fame sanctum…", "en"), true);
    assert.equal(shouldAttachHallOfFameLegalShield(59.9, "In the Hall of Fame sanctum…", "zh-Hant"), false);
    assert.equal(shouldAttachHallOfFameLegalShield(87, null, "zh-Hant"), false);
  });

  it("attachLegalShieldSuffix appends canonical zh copy as a single tail sentence", () => {
    const base = "在名人堂聖殿中，你正與 A、B 站在同一個王座座標。";
    const out = attachLegalShieldSuffix(base, "zh-Hant");
    assert.ok(out?.endsWith("僅供天梯對帳與娛樂參考。"));
    assert.equal(out, `${base}${DYNO_INTEL_HALL_OF_FAME_LEGAL_SHIELD_ZH}`);
    assert.doesNotMatch(out, /\n/);
  });

  it("attachLegalShieldSuffix appends canonical en copy as a single tail sentence", () => {
    const base = "In the Hall of Fame sanctum, you share the same throne coordinate as A, B.";
    const out = attachLegalShieldSuffix(base, "en");
    assert.ok(out?.endsWith("entertainment purposes."));
    assert.equal(out, `${base}${DYNO_INTEL_HALL_OF_FAME_LEGAL_SHIELD_EN}`);
  });
});
