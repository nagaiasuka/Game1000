import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CascadeEngine,
  MAX_SHOT_SECONDS,
} from "../src/games/008/logic/engine.ts";
import { sweepRect, sweepCircle } from "../src/games/008/logic/physics.ts";
import {
  MAX_BALLS,
  STEP,
  emptyEvents,
  type Stage,
} from "../src/games/008/logic/types.ts";
import { STAGES, endlessStage } from "../src/games/008/stages.ts";
import { CascadeAudioDirector } from "../src/games/008/audio.ts";
import {
  createRecordStore,
  initialRecords,
  parseRecords,
} from "../src/games/008/storage/records.ts";
const solutions = JSON.parse(
  readFileSync(new URL("./cascade-solutions.json", import.meta.url), "utf8"),
) as {
  stage: number;
  shots: { angle: number; wait: number }[];
  score: number;
  stars: number;
}[];
function finishShot(e: CascadeEngine, frameMs = 1000 / 60) {
  for (
    let i = 0;
    i < 3000 &&
    !["ready", "stage_clear", "game_over", "paused"].includes(e.state.phase);
    i++
  )
    e.advance(frameMs);
}
const blank = (): Stage => ({
  id: 1,
  title: "test",
  hint: "",
  shots: 4,
  stars: [2, 3],
  bricks: [
    { id: 1, x: 20, y: 40, w: 25, h: 15, hp: 1, maxHp: 1, kind: "normal" },
  ],
  walls: [],
  gates: [],
  bumpers: [],
});
for (const solution of solutions)
  for (const fps of [30, 60, 120])
    test(`stage ${solution.stage}: legal replay clears at ${fps}fps`, () => {
      const e = new CascadeEngine(STAGES[solution.stage - 1]);
      for (const shot of solution.shots) {
        for (let ms = 0; ms < shot.wait - 1e-5; ms += 1000 / fps)
          e.advance(1000 / fps);
        assert.equal(e.launch(shot.angle), true);
        finishShot(e, 1000 / fps);
        assert.ok(e.state.balls.length === 64 && e.activeBalls <= 64);
      }
      assert.equal(e.state.phase, "stage_clear");
      assert.equal(e.state.remaining, 0);
      assert.equal(e.state.stars, 3);
      assert.equal(e.state.score, solution.score);
      assert.equal(e.state.shotsResolved, solution.shots.length);
      assert.ok(!e.state.stage.feverCore || e.state.coreCleared);
    });
test("circle sweeps stop fast balls at faces and reflect rounded corners", () => {
  const h = sweepRect(30, 150, 300, 0, { x: 150, y: 130, w: 8, h: 40 }, 5)!;
  assert.ok(h.t > 0 && h.t < 1);
  assert.equal(h.nx, -1);
  assert.equal(
    sweepRect(0, 0, 100, 0, { x: 150, y: 130, w: 8, h: 40 }, 5),
    null,
  );
  const corner = sweepRect(
    130,
    110,
    30,
    30,
    { x: 150, y: 130, w: 20, h: 20 },
    5,
  )!;
  assert.ok(corner.nx < 0 && corner.ny < 0);
  assert.ok(Math.abs(Math.hypot(corner.nx, corner.ny) - 1) < 1e-7);
  const round = sweepCircle(20, 100, 300, 0, 180, 100, 30)!;
  assert.equal(round.nx, -1);
});
test("walls reflect without increasing speed and swept thin bricks cannot be skipped", () => {
  const stage = blank();
  stage.bricks[0] = { ...stage.bricks[0], x: 170, y: 200, w: 3, h: 12 };
  const e = new CascadeEngine(stage);
  e.launch(0);
  e.advance(1000 / 120);
  const b = e.state.balls.find((b) => b.active)!;
  Object.assign(b, { x: 160, y: 205, vx: 10000, vy: 0 });
  e.advance(1000 / 60);
  assert.equal(e.state.remaining, 0);
  const wall = new CascadeEngine(blank());
  wall.launch(0);
  wall.advance(1000 / 120);
  const w = wall.state.balls.find((b) => b.active)!;
  Object.assign(w, { x: 7, y: 400, vx: -400, vy: 0 });
  wall.advance(1000 / 120);
  assert.ok(w.vx > 0 && w.x >= 5);
});
test("six gates reach 64 real balls and each lineage crosses a gate only once", () => {
  const e = new CascadeEngine(STAGES[9]);
  e.launch(0);
  for (let i = 0; i < 360; i++) {
    e.advance(1000 / 120);
    assert.ok(e.activeBalls <= MAX_BALLS);
  }
  assert.equal(e.state.peakBalls, 64);
  const capped = e.state.balls.filter((b) => b.gates === 63);
  assert.ok(capped.length > 0);
});
test("pause freezes all physical timers and resume does not consume elapsed background time", () => {
  const e = new CascadeEngine(STAGES[9]);
  e.launch(0.2);
  e.advance(100);
  e.pause();
  const frozen = JSON.stringify(e.state);
  e.advance(10000);
  assert.equal(JSON.stringify(e.state), frozen);
  assert.equal(e.launch(0), false);
  e.resume();
  e.advance(1000 / 60);
  assert.equal(e.state.phase, "simulating");
  e.advance(300);
  assert.equal(e.state.phase, "paused");
});
test("fire is atomic, repeated overlap cannot double-award destruction, and shots terminate", () => {
  const e = new CascadeEngine(blank());
  assert.equal(e.launch(0), true);
  assert.equal(e.launch(0), false);
  assert.equal(e.state.used, 1);
  e.advance(1000 / 120);
  const b = e.state.balls.find((b) => b.active)!;
  Object.assign(b, { x: 30, y: 70, vx: 0, vy: -500 });
  e.advance(100);
  assert.equal(e.state.remaining, 0);
  const score = e.state.score;
  e.advance(10);
  assert.equal(e.state.score, score);
  finishShot(e);
  assert.equal(e.state.phase, "stage_clear");
  assert.equal(e.state.shotsResolved, 1);
  const scoreAfter = e.state.score;
  assert.equal(e.launch(0), false);
  e.advance(100);
  assert.equal(e.state.score, scoreAfter);
  const miss = new CascadeEngine(blank());
  for (let shot = 0; shot < 4; shot++) {
    assert.ok(miss.launch(1));
    finishShot(miss);
  }
  assert.equal(miss.state.phase, "game_over");
  assert.ok(miss.state.shotTime <= MAX_SHOT_SECONDS + STEP);
});
test("bomb chains score once, switches open doors, core requires fever, restart restores HP", () => {
  const bomb = new CascadeEngine(STAGES[4]);
  bomb.launch(solutions[4].shots[0].angle);
  finishShot(bomb);
  assert.equal(bomb.state.remaining, 0);
  assert.ok(bomb.state.maxCombo >= 15);
  assert.equal(
    bomb.restart().state.stage.bricks.filter((b) => b.hp > 0).length,
    15,
  );
  const sw = new CascadeEngine(STAGES[5]);
  sw.launch(solutions[5].shots[0].angle);
  finishShot(sw);
  assert.equal(sw.state.open, true);
  const core = blank();
  core.feverCore = true;
  core.bricks[0] = { ...core.bricks[0], kind: "core" };
  const e = new CascadeEngine(core);
  e.launch(0);
  e.advance(1000 / 120);
  const b = e.state.balls.find((b) => b.active)!;
  Object.assign(b, { x: 30, y: 70, vx: 0, vy: -500 });
  e.advance(60);
  assert.equal(e.state.remaining, 1);
  assert.equal(e.state.coreCleared, false);
  e.state.feverLeft = 2;
  Object.assign(b, { x: 30, y: 70, vx: 0, vy: -500, contacts: [] });
  e.advance(60);
  assert.equal(e.state.coreCleared, true);
});
test("endless templates stay deterministic, advance IDs and scale armor with a finite cap", () => {
  assert.deepEqual(endlessStage(11), endlessStage(11));
  assert.equal(endlessStage(11).id, 11);
  assert.equal(endlessStage(11).bricks[0].hp, STAGES[0].bricks[0].hp + 1);
  assert.equal(endlessStage(1001).bricks[0].hp, STAGES[0].bricks[0].hp + 3);
});
test("audio batches 10000 collisions into bounded cues with no delayed backlog", () => {
  const director = new CascadeAudioDirector();
  let calls = 0;
  for (let i = 0; i < 10000; i++) {
    const cues = director.consume(
      { ...emptyEvents(), hit: 64, broken: 32, gate: 1, bomb: 1 },
      i % 50,
      i / 120,
    );
    assert.ok(cues.length <= 2);
    calls += cues.length;
  }
  assert.ok(calls < 1800);
  assert.deepEqual(director.consume(emptyEvents(), 0, 100), []);
  assert.deepEqual(
    director.consume({ ...emptyEvents(), clear: true, hit: 64 }, 64, 100, true),
    ["cascadeWin"],
  );
});
test("records recover bad data, retain per-stage maxima, serialize saves and allow retry after failure", async () => {
  for (const raw of ["bad", "null", "[]", '{"stages":null}'])
    assert.deepEqual(parseRecords(raw), initialRecords());
  const parsed = parseRecords(
    '{"highest":999,"stages":{"1":{"score":123,"stars":9},"99":{"score":100}}}',
  );
  assert.equal(parsed.highest, 10);
  assert.equal(parsed.stages[1].stars, 3);
  assert.equal(parsed.stages[99], undefined);
  let raw: string | null = null,
    fail = false;
  const store = createRecordStore({
    getItem: async () => raw,
    setItem: async (_k, v) => {
      if (fail) throw Error("full");
      raw = v;
    },
  });
  const a = { ...initialRecords(), stages: { 1: { score: 1000, stars: 2 } } };
  const b = {
    ...initialRecords(),
    stages: { 1: { score: 500, stars: 3 } },
    endlessBest: 300,
  };
  await Promise.all([store.save(a), store.save(b)]);
  const r = await store.load();
  assert.deepEqual(r.stages[1], { score: 1000, stars: 3 });
  assert.equal(r.highest, 2);
  assert.equal(r.endlessBest, 300);
  fail = true;
  await assert.rejects(store.save(a));
  fail = false;
  await store.save(b);
  assert.equal((await store.load()).stages[1].score, 1000);
});

test("008 integrates with solo discovery and favorites without joining multiplayer filters", async () => {
  const { games, filterGames } = await import("../src/data/catalog.ts");
  const { randomCandidates } = await import("../src/data/random-game.ts");
  const game = games.find((g) => g.id === "008")!;
  assert.equal(game.status, "available");
  assert.ok(filterGames(games, "1").includes(game));
  assert.ok(!filterGames(games, "2").includes(game));
  assert.deepEqual(randomCandidates(games, "1", ["008"]), [game]);
});
