import test from "node:test";
import assert from "node:assert/strict";
import {
  createMatch,
  reducer,
  rankings,
  stepDelay,
  type Match,
  type PlayerCount,
} from "../src/games/007/logic/engine.ts";
import { blockSounds, catchSound } from "../src/games/007/audio.ts";
import { games, filterGames } from "../src/data/catalog.ts";
import { randomCandidates } from "../src/data/random-game.ts";
import { sceneEffects } from "../src/audio/types.ts";
function catchFish(state: Match, id: number) {
  let m = reducer(state, { type: "select", id });
  assert.equal(m.phase, "casting");
  m = reducer(m, { type: "advance" });
  m = reducer(m, { type: "lift" });
  let elapsed = stepDelay(m);
  while (m.phase !== "caught") {
    m = reducer(m, { type: "advance" });
    if (m.phase !== "caught") elapsed += stepDelay(m);
  }
  assert.ok(elapsed >= 799 && elapsed <= 2001);
  return m;
}
test("007 participates in discovery, favorites intersection and 2–4 player filters", () => {
  const g = games.find((g) => g.id === "007")!;
  assert.equal(g.status, "available");
  for (const filter of ["2", "3-4"])
    assert.ok(filterGames(games, filter).includes(g));
  for (const filter of ["1", "5+"])
    assert.ok(!filterGames(games, filter).includes(g));
  assert.deepEqual(randomCandidates(games, "3-4", ["007"]), [g]);
});
for (const players of [2, 3, 4] as PlayerCount[]) {
  test(`${players} players get equal turns, conserved scores, and a rotated first player`, () => {
    for (let first = 0; first < players; first++) {
      let m = createMatch(players, first, () => 0.999);
      assert.equal(m.turn, first);
      assert.deepEqual(
        m.fish.map((f) => f.blocks),
        players === 3 ? [2, 3, 4, 5, 5, 6, 7, 8, 9] : [2, 3, 4, 5, 6, 7, 8, 9],
      );
      for (const fish of m.fish) {
        const before = m;
        m = catchFish(m, fish.id);
        assert.equal(before.fish[fish.id].caught, false);
        assert.equal(
          m.scores.reduce((a, b) => a + b, 0),
          m.catches.flat().reduce((a, b) => a + b, 0),
        );
        assert.equal(m.fish.filter((f) => f.caught).length, m.completed);
        assert.equal(reducer(m, { type: "advance" }), m); // cannot award twice
        m = reducer(m, { type: "next" });
      }
      assert.equal(m.phase, "finished");
      assert.ok(
        m.catches.every(
          (c) => c.length === (players === 2 ? 4 : players === 3 ? 3 : 2),
        ),
      );
      assert.equal(
        m.scores.reduce((a, b) => a + b, 0),
        players === 3 ? 49 : 44,
      );
      assert.equal(
        createMatch(players, (first + 1) % players).turn,
        (first + 1) % players,
      );
    }
  });
}
test("hidden lengths are shuffled independently of IDs, with the same inventory", () => {
  const a = createMatch(3, 0, () => 0),
    b = createMatch(3, 0, () => 0.999);
  assert.notDeepEqual(
    a.fish.map((f) => f.blocks),
    b.fish.map((f) => f.blocks),
  );
  assert.deepEqual(
    a.fish.map((f) => f.blocks).sort(),
    b.fish.map((f) => f.blocks).sort(),
  );
  assert.deepEqual(
    a.fish.map((f) => f.id),
    b.fish.map((f) => f.id),
  );
});
test("selection needs a separate lift; inputs during animations and duplicate catches are ignored", () => {
  let m = createMatch(2);
  assert.equal(reducer(m, { type: "lift" }), m);
  assert.equal(reducer(m, { type: "select", id: 99 }), m);
  m = reducer(m, { type: "select", id: 0 });
  assert.equal(m.revealed, 0);
  assert.equal(reducer(m, { type: "select", id: 1 }), m);
  assert.equal(reducer(m, { type: "lift" }), m);
  m = reducer(m, { type: "advance" });
  assert.equal(m.phase, "hooked");
  assert.equal(m.revealed, 0);
  m = reducer(m, { type: "lift" });
  assert.equal(reducer(m, { type: "lift" }), m);
  while (m.phase !== "caught") {
    const prev = m;
    m = reducer(m, { type: "advance" });
    assert.ok(m.revealed - prev.revealed <= 1);
    if (m.phase !== "caught") assert.deepEqual(m.scores, [0, 0]);
  }
  m = reducer(m, { type: "next" });
  assert.equal(reducer(m, { type: "select", id: 0 }), m);
});
test("ties share competition rank; reversals require crossing an opponent's score", () => {
  assert.deepEqual(
    rankings([10, 11, 10, 13]).map((p) => [p.player, p.rank]),
    [
      [3, 1],
      [1, 2],
      [0, 3],
      [2, 3],
    ],
  );
  const base = createMatch(2, 0, () => 0.999);
  assert.equal(catchFish({ ...base, scores: [0, 1] }, 0).overtake, true);
  assert.equal(catchFish({ ...base, scores: [0, 2] }, 0).overtake, false);
  assert.equal(catchFish({ ...base, scores: [2, 2] }, 0).overtake, false);
  assert.equal(catchFish({ ...base, scores: [5, 1] }, 0).overtake, false);
});
test("all nine ascending tones and catch tiers are in the scene-local shared audio pool", () => {
  assert.equal(new Set(blockSounds).size, 9);
  for (const sound of [
    ...blockSounds,
    catchSound(2),
    catchSound(5),
    catchSound(7),
    catchSound(9),
  ])
    assert.ok(sceneEffects["007"].includes(sound));
  assert.equal(sceneEffects["007"].length, 20);
});
