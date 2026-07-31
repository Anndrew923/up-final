import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GENESIS_EARLY_BIRD_SEAT_LIMIT_DEFAULT,
  resolveGenesisEarlyBirdSeatLimit,
  resolveGenesisUploadDecision,
} from "../shared/genesisEarlyBird.js";

describe("genesisEarlyBird decision matrix", () => {
  it("defaults seat limit to 2000", () => {
    assert.equal(GENESIS_EARLY_BIRD_SEAT_LIMIT_DEFAULT, 2000);
    const previous = process.env.GENESIS_EARLY_BIRD_SEAT_LIMIT;
    delete process.env.GENESIS_EARLY_BIRD_SEAT_LIMIT;
    assert.equal(resolveGenesisEarlyBirdSeatLimit(), 2000);
    process.env.GENESIS_EARLY_BIRD_SEAT_LIMIT = "150";
    assert.equal(resolveGenesisEarlyBirdSeatLimit(), 150);
    if (previous == null) delete process.env.GENESIS_EARLY_BIRD_SEAT_LIMIT;
    else process.env.GENESIS_EARLY_BIRD_SEAT_LIMIT = previous;
  });

  it("always allows Pro regardless of seat pressure", () => {
    assert.deepEqual(
      resolveGenesisUploadDecision({
        hasPro: true,
        paywallForced: true,
        alreadyClaimed: false,
        claimedCount: 2000,
        seatLimit: 2000,
      }),
      { allow: true, action: "none" }
    );
  });

  it("forces Pro when paywall flag is on for non-Pro users", () => {
    assert.deepEqual(
      resolveGenesisUploadDecision({
        hasPro: false,
        paywallForced: true,
        alreadyClaimed: true,
        claimedCount: 10,
        seatLimit: 2000,
      }),
      { allow: false, action: "none", reason: "pro-required" }
    );
  });

  it("grandfathers already-claimed free seats", () => {
    assert.deepEqual(
      resolveGenesisUploadDecision({
        hasPro: false,
        paywallForced: false,
        alreadyClaimed: true,
        claimedCount: 2000,
        seatLimit: 2000,
      }),
      { allow: true, action: "none" }
    );
  });

  it("claims a seat while under the cap", () => {
    assert.deepEqual(
      resolveGenesisUploadDecision({
        hasPro: false,
        paywallForced: false,
        alreadyClaimed: false,
        claimedCount: 1999,
        seatLimit: 2000,
      }),
      { allow: true, action: "claim" }
    );
  });

  it("blocks new free claims at the hard cap", () => {
    assert.deepEqual(
      resolveGenesisUploadDecision({
        hasPro: false,
        paywallForced: false,
        alreadyClaimed: false,
        claimedCount: 2000,
        seatLimit: 2000,
      }),
      { allow: false, action: "none", reason: "seats-full" }
    );
  });
});
