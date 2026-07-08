import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  HALL_OF_FAME_MAX_DISPLAY_NAMES,
  resolveHallOfFameDisplayNames,
  resolveHallOfFameSentence,
} from "../dynoIntel/hallOfFameResolver.js";
import matrixDoc from "../dynoIntel/data/hallOfFameMatrix.v1.json" with { type: "json" };

describe("hallOfFameResolver v5.0", () => {
  it("loads sparse matrix with 71 populated cells (9 intentional blanks omitted)", () => {
    assert.equal(matrixDoc.entries.length, 71);
    assert.equal(HALL_OF_FAME_MAX_DISPLAY_NAMES, 3);
  });

  it("strips parenthetical reference scores from display names", () => {
    const names = resolveHallOfFameDisplayNames("strength", "150");
    assert.ok(names.length > 0);
    assert.ok(names.every((name) => !/\(\d+\)/.test(name)));
    assert.ok(names.some((name) => /Larry Wheels|Becca Swanson/i.test(name)));
  });

  it("caps display names at three per cell", () => {
    const names = resolveHallOfFameDisplayNames("cardio", "150");
    assert.ok(names.length <= 3);
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
    const sentence = resolveHallOfFameSentence(
      "strength",
      "80",
      "In the Hall of Fame sanctum, you share the same throne coordinate as {{names}}.",
      { nameGlue: ", " }
    );
    assert.ok(sentence);
    assert.match(sentence, /Jason Statham, Chris Hemsworth|Chris Hemsworth, Conor McGregor/);
    assert.doesNotMatch(sentence, /、/);
  });
});
