import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CONFIRM_DELETE_ACCOUNT,
  CONFIRM_REMOVE_FROM_LADDER,
  buildLookupOverallScore,
  validateLookupInput,
  validateTargetConfirmInput,
} from "../ladder/adminUserOpsCore.js";

describe("adminUserOps validators", () => {
  it("requires lookup query", () => {
    assert.equal(validateLookupInput({}).ok, false);
    assert.equal(validateLookupInput({ query: "  " }).ok, false);
    const ok = validateLookupInput({ query: " topaj01@gmail.com " });
    assert.equal(ok.ok, true);
    assert.equal(ok.query, "topaj01@gmail.com");
  });

  it("requires exact confirm phrases", () => {
    assert.equal(
      validateTargetConfirmInput(
        { targetUid: "u1", confirmPhrase: "remove" },
        CONFIRM_REMOVE_FROM_LADDER
      ).ok,
      false
    );
    const remove = validateTargetConfirmInput(
      { targetUid: "u1", confirmPhrase: "REMOVE" },
      CONFIRM_REMOVE_FROM_LADDER
    );
    assert.equal(remove.ok, true);

    const del = validateTargetConfirmInput(
      { targetUid: "u1", confirmPhrase: "DELETE" },
      CONFIRM_DELETE_ACCOUNT
    );
    assert.equal(del.ok, true);
    assert.equal(CONFIRM_DELETE_ACCOUNT, "DELETE");
  });
});

describe("buildLookupOverallScore", () => {
  it("averages across all six axes with missing as 0", () => {
    // Only strength=120 → mean = 120/6 = 20 (not 120).
    const score = buildLookupOverallScore({ strength: 120 });
    assert.equal(score, 20);
  });

  it("returns null when all axes are zero/empty", () => {
    assert.equal(buildLookupOverallScore({}), null);
    assert.equal(buildLookupOverallScore(null), null);
  });
});
