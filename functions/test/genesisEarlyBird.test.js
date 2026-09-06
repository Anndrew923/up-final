import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildGenesisSeatPublicSummary,
  buildUserGenesisMirrorFields,
  GENESIS_EARLY_BIRD_SEAT_LIMIT_DEFAULT,
  GENESIS_SEAT_CLOSING_AFTER,
  GENESIS_SEAT_GROWTH_MIN,
  normalizeGenesisSeatNumber,
  resolveGenesisEarlyBirdSeatLimit,
  resolveGenesisUploadDecision,
} from "../shared/genesisEarlyBird.js";

describe("genesisEarlyBird decision matrix", () => {
  it("builds user-doc mirror fields (Scheme A)", () => {
    assert.deepEqual(buildUserGenesisMirrorFields(42), {
      isGenesisEarlyBird: true,
      genesisSeatNumber: 42,
    });
    assert.deepEqual(buildUserGenesisMirrorFields(null), {
      isGenesisEarlyBird: true,
      genesisSeatNumber: null,
    });
    assert.equal(normalizeGenesisSeatNumber(0), null);
    assert.equal(normalizeGenesisSeatNumber("7"), null);
  });

  it("builds staged public summary without exposing claimedCount", () => {
    const now = new Date("2026-09-06T00:00:00.000Z");
    const early = buildGenesisSeatPublicSummary({
      claimedCount: GENESIS_SEAT_GROWTH_MIN - 1,
      seatLimit: 2000,
      now,
    });
    assert.equal(early.stage, "early");
    assert.equal(early.seatLimit, 2000);
    assert.equal(early.percentBucket, undefined);
    assert.equal(early.remaining, undefined);
    assert.equal("claimedCount" in early, false);

    const growth = buildGenesisSeatPublicSummary({
      claimedCount: GENESIS_SEAT_GROWTH_MIN,
      seatLimit: 2000,
      now,
    });
    assert.equal(growth.stage, "growth");
    assert.equal(growth.percentBucket, 10);

    const growthMid = buildGenesisSeatPublicSummary({
      claimedCount: 800,
      seatLimit: 2000,
      now,
    });
    assert.equal(growthMid.stage, "growth");
    assert.equal(growthMid.percentBucket, 40);

    const closing = buildGenesisSeatPublicSummary({
      claimedCount: GENESIS_SEAT_CLOSING_AFTER + 1,
      seatLimit: 2000,
      now,
    });
    assert.equal(closing.stage, "closing");
    assert.equal(closing.remaining, 499);
    assert.equal(closing.percentBucket, undefined);

    const endedFull = buildGenesisSeatPublicSummary({
      claimedCount: 2000,
      seatLimit: 2000,
      now,
    });
    assert.equal(endedFull.stage, "ended");

    const endedPaywall = buildGenesisSeatPublicSummary({
      claimedCount: 10,
      seatLimit: 2000,
      paywallForced: true,
      now,
    });
    assert.equal(endedPaywall.stage, "ended");
  });

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

  it("forces Pro when paywall flag is on for non-seat free users", () => {
    assert.deepEqual(
      resolveGenesisUploadDecision({
        hasPro: false,
        paywallForced: true,
        alreadyClaimed: false,
        claimedCount: 10,
        seatLimit: 2000,
      }),
      { allow: false, action: "none", reason: "pro-required" }
    );
  });

  it("grandfathers already-claimed seats even after paywall cutover", () => {
    assert.deepEqual(
      resolveGenesisUploadDecision({
        hasPro: false,
        paywallForced: true,
        alreadyClaimed: true,
        claimedCount: 2000,
        seatLimit: 2000,
      }),
      { allow: true, action: "none" }
    );
  });

  it("grandfathers already-claimed free seats while genesis is open", () => {
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

  it("documents claimSeat contract: under-cap without seat may gate-only allow", () => {
    // Preview paths use claimSeat=false; they must mirror under-cap allow without writing.
    const gateOnly = resolveGenesisUploadDecision({
      hasPro: false,
      paywallForced: false,
      alreadyClaimed: false,
      claimedCount: 10,
      seatLimit: 2000,
    });
    assert.equal(gateOnly.allow, true);
    assert.equal(gateOnly.action, "claim");
  });
});
