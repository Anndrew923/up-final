import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  checkIdentityFanOutAllowed,
  recordIdentityFanOut,
} from "../ladder/identityFanOutDebounce.js";
import {
  IDENTITY_FANOUT_DEBOUNCE_MS,
  IDENTITY_FANOUT_WAVE_GRACE_MS,
} from "../shared/constants.js";

describe("identityFanOutDebounce", () => {
  it("allows first fan-out and starts a new wave", () => {
    const gate = checkIdentityFanOutAllowed({}, 1_000_000);
    assert.equal(gate.allowed, true);
    assert.equal(gate.startNewWave, true);
  });

  it("allows patches inside the same wave grace window", () => {
    const rateDoc = {};
    const t0 = 5_000_000;
    recordIdentityFanOut(rateDoc, t0, { startNewWave: true });
    const gate = checkIdentityFanOutAllowed(rateDoc, t0 + IDENTITY_FANOUT_WAVE_GRACE_MS - 1);
    assert.equal(gate.allowed, true);
    assert.equal(gate.startNewWave, false);
  });

  it("blocks after wave grace until 24h debounce elapses", () => {
    const rateDoc = {};
    const t0 = 5_000_000;
    recordIdentityFanOut(rateDoc, t0, { startNewWave: true });
    const blocked = checkIdentityFanOutAllowed(
      rateDoc,
      t0 + IDENTITY_FANOUT_WAVE_GRACE_MS + 1
    );
    assert.equal(blocked.allowed, false);

    const afterDay = checkIdentityFanOutAllowed(
      rateDoc,
      t0 + IDENTITY_FANOUT_DEBOUNCE_MS + 1
    );
    assert.equal(afterDay.allowed, true);
    assert.equal(afterDay.startNewWave, true);
  });
});
