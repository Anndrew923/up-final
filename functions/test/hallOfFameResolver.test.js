import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  HALL_OF_FAME_MAX_DISPLAY_NAMES,
  resolveHallOfFameDisplayNames,
  resolveHallOfFameSentence,
  sampleHallOfFameNames,
} from "../dynoIntel/hallOfFameResolver.js";
import matrixDoc from "../dynoIntel/data/hallOfFameMatrix.v1.json" with { type: "json" };

describe("hallOfFameResolver v5.0", () => {
  it("loads sparse matrix with 71 populated cells (9 intentional blanks omitted)", () => {
    assert.equal(matrixDoc.entries.length, 71);
    assert.equal(HALL_OF_FAME_MAX_DISPLAY_NAMES, 3);
  });

  it("v5.10 — persists full cell rosters beyond the runtime display cap", () => {
    const overall90 = matrixDoc.entries.find(
      (entry) => entry.decadeKey === "90" && entry.axisId === "overall"
    );
    assert.ok(overall90);
    assert.ok(overall90.anchors.length > 3, `expected full 90:overall pool, got ${overall90.anchors.length}`);
    const joined = overall90.anchors.map((a) => a.displayZh).join("|");
    assert.match(joined, /Bruce Lee/i);
    assert.match(joined, /林書豪/);
    assert.match(joined, /Haaland/i);

    const oversized = matrixDoc.entries.filter((entry) => (entry.anchors?.length ?? 0) > 3);
    assert.ok(oversized.length > 20, `expected many full cells, got ${oversized.length}`);
  });

  it("strips parenthetical reference scores from display names", () => {
    const names = resolveHallOfFameDisplayNames("strength", "150", 99);
    assert.ok(names.length > 0);
    assert.ok(names.every((name) => !/\(\d+\)/.test(name)));
    assert.ok(names.some((name) => /Larry Wheels|Becca Swanson/i.test(name)));
  });

  it("caps default display names at three per cell while full pool remains available", () => {
    const names = resolveHallOfFameDisplayNames("cardio", "150");
    assert.ok(names.length <= 3);
    const full = resolveHallOfFameDisplayNames("cardio", "150", 99);
    assert.ok(full.length >= names.length);
  });

  it("v5.8 — shuffle samples from the cell pool without leaving the pool", () => {
    const pool = resolveHallOfFameDisplayNames("strength", "80", 99);
    assert.ok(pool.length >= 2);
    const sampled = resolveHallOfFameDisplayNames("strength", "80", 2, { shuffle: true });
    assert.equal(sampled.length, 2);
    assert.ok(sampled.every((name) => pool.includes(name)));
    assert.equal(new Set(sampled).size, sampled.length);
  });

  it("v5.8 — sampleHallOfFameNames respects limit and uniqueness", () => {
    const sampled = sampleHallOfFameNames(["A", "B", "C", "D"], 3);
    assert.equal(sampled.length, 3);
    assert.equal(new Set(sampled).size, 3);
    assert.ok(sampled.every((name) => ["A", "B", "C", "D"].includes(name)));
  });

  it("v5.10 — repeated samples from a large overall pool diverge across draws", () => {
    const pool = resolveHallOfFameDisplayNames("overall", "90", 99);
    assert.ok(pool.length > 6);
    const sets = [];
    for (let i = 0; i < 24; i += 1) {
      sets.push(sampleHallOfFameNames(pool, 3).slice().sort().join("|"));
    }
    const unique = new Set(sets);
    assert.ok(unique.size > 1, `expected diverging samples, got only ${[...unique].join(" || ")}`);
  });

  it("returns empty for decades below 60 or blank cells", () => {
    assert.deepEqual(resolveHallOfFameDisplayNames("overall", "140"), []);
    assert.deepEqual(resolveHallOfFameDisplayNames("explosivePower", "70"), []);
    assert.deepEqual(resolveHallOfFameDisplayNames("strength", "50"), []);
  });

  it("renders hall-of-fame sentence template with joined names", () => {
    const sentence = resolveHallOfFameSentence(
      "strength",
      "80",
      "在名人堂聖殿中，你正與 {{names}} 站在同一個王座座標。"
    );
    assert.ok(sentence);
    assert.match(sentence, /在名人堂聖殿中/);
    assert.doesNotMatch(sentence, /\{\{names\}\}/);
  });

  it("renders EN hall-of-fame sentence with comma-separated Western names", () => {
    const pool = resolveHallOfFameDisplayNames("strength", "80", 99);
    const sentence = resolveHallOfFameSentence(
      "strength",
      "80",
      "In the Hall of Fame sanctum, you share the same throne coordinate as {{names}}.",
      { nameGlue: ", " }
    );
    assert.ok(sentence);
    assert.doesNotMatch(sentence, /、/);
    assert.doesNotMatch(sentence, /\{\{names\}\}/);
    // Sampled trio must come from the full strength/80 pool (order rotates).
    const match = sentence.match(/as (.+)\.$/);
    assert.ok(match?.[1]);
    for (const name of match[1].split(", ")) {
      assert.ok(pool.includes(name), `unexpected sampled name ${name}`);
    }
  });

  it("v5.8.1 — status hall sentence rotates name order across draws", () => {
    const orders = new Set();
    for (let i = 0; i < 20; i += 1) {
      const sentence = resolveHallOfFameSentence(
        "strength",
        "80",
        "在名人堂聖殿中，你正與 {{names}} 站在同一個王座座標。"
      );
      const match = sentence.match(/你正與 (.+) 站在同一個王座座標/);
      assert.ok(match?.[1]);
      orders.add(match[1]);
    }
    assert.ok(orders.size > 1, `expected rotating orders, got ${[...orders].join(" || ")}`);
  });
});
