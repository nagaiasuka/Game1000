import test from "node:test";
import assert from "node:assert/strict";
import { availableCount, filterGames, games } from "../src/data/catalog.ts";

test("preview games do not inflate the playable count", () => {
  assert.equal(availableCount(games), 8);
  assert.equal(
    availableCount(games.filter((g) => g.status === "coming-soon")),
    0,
  );
  assert.equal(
    availableCount([
      ...games,
      { ...games[0], status: "available", route: "/play/001" },
    ]),
    9,
  );
});
test("player filters use overlapping player ranges, including five or more", () => {
  assert.deepEqual(
    filterGames(games, "1").map((g) => g.id),
    ["001", "002", "008"],
  );
  assert.deepEqual(
    filterGames(games, "2").map((g) => g.id),
    ["003", "004", "005", "006", "007"],
  );
  assert.deepEqual(
    filterGames(games, "3-4").map((g) => g.id),
    ["007"],
  );
  assert.deepEqual(
    filterGames(games, "5+").map((g) => g.id),
    [],
  );
  assert.equal(filterGames(games, "all").length, 8);
});
test("collections do not present placeholders as new or popular", () => {
  assert.equal(filterGames(games, "all", "popular").length, 0);
  assert.equal(filterGames(games, "all", "new").length, 8);
  assert.equal(new Set(games.map((g) => g.id)).size, games.length);
});
