import test from "node:test";
import assert from "node:assert/strict";
import { BlockBreakEngine, STEP } from "../src/games/002/logic/engine.ts";
import {
  fieldLayout,
  WIDTH,
  HEIGHT,
  PADDLE_Y,
  RADIUS,
  MAX_SPEED,
  paddleBounce,
  sweep,
} from "../src/games/002/logic/physics.ts";
import {
  STAGES,
  buildStage,
  buildIncomingRow,
  growthFloor,
  BRICK_HEIGHT,
  COLUMNS,
  type Brick,
} from "../src/games/002/stages.ts";
import {
  BEST_KEY,
  PROGRESS_KEY,
  createRecordStore,
  parseRecords,
} from "../src/games/002/storage/records.ts";
import { games } from "../src/data/catalog.ts";
import { projectProgress } from "../src/utils/project.ts";
const advance = (e: BlockBreakEngine, ms: number) => {
  for (let t = 0; t < ms; t += 10) e.advance(Math.min(10, ms - t));
};
function playing(rng: () => number = () => 0.99) {
  const e = new BlockBreakEngine(rng);
  e.start();
  advance(e, 500);
  e.launch();
  return e;
}
const brick = (hp = 1, id = 1, x = 160, y = 100): Brick => ({
  id,
  x,
  y,
  w: 32,
  h: 17,
  hp,
  maxHp: hp,
  row: 0,
});
function hit(e: BlockBreakEngine, b = brick()) {
  e.state.bricks = [b, brick(1, 999, 300, 60)];
  Object.assign(e.state.balls[0], {
    x: b.x + 16,
    y: b.y + b.h + RADIUS + 1,
    vx: 0,
    vy: -300,
    contacts: [],
  });
  e.advance(STEP);
}
test("002 is playable and ROAD TO 100 counts the current catalog", () => {
  assert.equal(games.find((g) => g.id === "002")?.status, "available");
  assert.equal(projectProgress(games, 100).countLabel, "003 / 100");
  assert.equal(projectProgress(games, 100).remaining, 97);
});
test("ten distinct, bounded stages introduce durability, steel and rush", () => {
  assert.equal(STAGES.length, 10);
  assert.equal(new Set(STAGES.map((s) => s.rows.join(""))).size, 10);
  for (let i = 0; i < 10; i++) {
    const blocks = buildStage(i);
    assert.ok(blocks.some((b) => b.hp > 0));
    assert.equal(new Set(blocks.map((b) => b.id)).size, blocks.length);
    assert.ok(
      blocks.every(
        (b) => b.x >= 0 && b.x + b.w < WIDTH && b.y + b.h < PADDLE_Y,
      ),
    );
    assert.ok(STAGES[i].speed <= MAX_SPEED);
  }
  assert.ok(buildStage(0).every((b) => b.hp === 1));
  assert.ok(buildStage(2).some((b) => b.hp === 2));
  assert.ok(buildStage(5).some((b) => b.hp === -1));
  assert.ok(
    buildStage(8)
      .filter((b) => b.hp > 0)
      .every((b) => b.hp === 1),
  );
  const first = buildStage(0);
  first[0].hp = 99;
  assert.equal(buildStage(0)[0].hp, 1);
});
test("locked stages cannot start and launch waits for READY", () => {
  const e = new BlockBreakEngine();
  e.start(1);
  assert.equal(e.state.phase, "select");
  e.start();
  e.launch();
  assert.equal(e.state.phase, "ready");
  advance(e, 500);
  e.launch();
  assert.equal(e.state.phase, "playing");
  assert.ok(e.state.balls[0].vy < 0);
});
test("paddle follows drag smoothly, clamps, and carries the waiting ball", () => {
  const e = new BlockBreakEngine();
  e.start();
  e.movePaddle(-100);
  e.advance(STEP);
  assert.ok(e.state.paddle > 40 && e.state.paddle < 180);
  advance(e, 1000);
  assert.ok(e.state.paddle >= 40);
  assert.equal(e.state.balls[0].x, e.state.paddle);
  e.movePaddle(999);
  advance(e, 1000);
  assert.ok(e.state.paddle <= WIDTH - 40);
});
test("paddle edges aim in opposite directions with minimum upward speed", () => {
  const left = paddleBounce(140, 180, 80, 300),
    right = paddleBounce(220, 180, 80, 300);
  assert.ok(left.vx < 0 && right.vx > 0 && left.vy < -140 && right.vy < -140);
  const middle = paddleBounce(180, 180, 80, 300);
  assert.ok(middle.vx !== 0 && middle.vy < -290);
  assert.ok(Math.abs(Math.hypot(left.vx, left.vy) - 300) < 1e-8);
});
test("swept collisions detect thin bricks across large movement, including sides", () => {
  assert.ok(sweep(176, 200, 0, -160, brick()));
  assert.equal(sweep(20, 200, 0, -160, brick()), null);
  assert.equal(sweep(176, 200, 0, 160, brick()), null);
  assert.equal(sweep(100, 108, 100, 0, brick())?.nx, -1);
});
test("walls and ceiling reflect; paddle catches only downward balls from above", () => {
  const e = playing();
  e.state.bricks = [];
  Object.assign(e.state.balls[0], { x: RADIUS + 1, y: 300, vx: -300, vy: -40 });
  e.advance(STEP);
  assert.ok(e.state.balls[0].vx > 0);
  Object.assign(e.state.balls[0], { x: 180, y: RADIUS + 1, vx: 30, vy: -300 });
  e.advance(STEP);
  assert.ok(e.state.balls[0].vy > 0);
  Object.assign(e.state.balls[0], {
    x: 180,
    y: PADDLE_Y - RADIUS - 1,
    vx: 0,
    vy: 300,
  });
  e.advance(STEP);
  assert.ok(e.state.balls[0].vy < 0);
  Object.assign(e.state.balls[0], {
    x: 180,
    y: PADDLE_Y + 10,
    vx: 0,
    vy: -300,
  });
  e.advance(STEP);
  assert.ok(e.state.balls[0].vy < 0);
});
test("a brick breaks once, scores and emits bounded feedback", () => {
  const e = playing();
  hit(e);
  assert.equal(e.state.score, 100);
  assert.equal(e.state.combo, 1);
  assert.equal(e.state.bricks.length, 1);
  assert.ok(e.state.balls[0].vy > 0);
  assert.ok(e.state.sparks.length > 0);
  assert.equal(e.state.popups[0].value, 100);
  assert.ok(e.drainEvents().includes("break"));
  advance(e, 50);
  assert.equal(e.state.score, 100);
});
test("durable bricks damage per contact and award durability bonus only on destruction", () => {
  const e = playing();
  hit(e, brick(3));
  assert.equal(e.state.bricks[0].hp, 2);
  assert.equal(e.state.score, 0);
  hit(e, e.state.bricks[0]);
  assert.equal(e.state.bricks[0].hp, 1);
  hit(e, e.state.bricks[0]);
  assert.equal(e.state.score, 200);
});
test("steel reflects without destruction or score", () => {
  const e = playing();
  hit(e, brick(-1));
  assert.equal(e.state.bricks[0].hp, -1);
  assert.equal(e.state.score, 0);
  assert.ok(e.state.balls[0].vy > 0);
});
test("combos increase multiplier, expire, and preserve maximum", () => {
  const e = playing();
  for (let i = 0; i < 5; i++) hit(e);
  assert.equal(e.state.combo, 5);
  assert.equal(e.state.score, 600);
  assert.equal(e.state.maxCombo, 5);
  e.state.bricks = [];
  Object.assign(e.state.balls[0], { x: 180, y: 300, vx: 0, vy: 0 });
  advance(e, 3600);
  assert.equal(e.state.combo, 5);
  advance(e, 1000);
  assert.equal(e.state.combo, 0);
  assert.equal(e.state.maxCombo, 5);
});
test("FEVER doubles scores for eight seconds and then ends", () => {
  const e = playing();
  for (let i = 0; i < 13; i++) hit(e);
  assert.ok(e.state.feverLeft > 7.9);
  const before = e.state.score;
  hit(e);
  assert.equal(e.state.score - before, 600);
  e.state.bricks = [];
  Object.assign(e.state.balls[0], { x: 180, y: 300, vx: 0, vy: 0 });
  advance(e, 8100);
  assert.equal(e.state.feverLeft, 0);
});
test("injected randomness determines item drops", () => {
  const e = playing(() => 0);
  hit(e);
  assert.equal(e.state.items[0]?.kind, "multi");
  const none = playing(() => 0.99);
  hit(none);
  assert.equal(none.state.items.length, 0);
});
for (const kind of ["multi", "wide", "power"] as const)
  test(`${kind} is caught by paddle; effects are bounded`, () => {
    const e = playing();
    e.state.items = [{ id: 99, x: e.state.paddle, y: PADDLE_Y - 8, kind }];
    e.advance(STEP);
    assert.equal(e.state.items.length, 0);
    assert.ok(e.drainEvents().includes("item"));
    if (kind === "multi") {
      assert.equal(e.state.balls.length, 3);
      assert.ok(
        e.state.balls.every((b) => Math.hypot(b.vx, b.vy) <= MAX_SPEED),
      );
    }
    if (kind === "wide") {
      assert.equal(e.paddleWidth, 126);
      assert.equal(e.state.wideLeft, 12);
    }
    if (kind === "power") assert.equal(e.state.powerLeft, 8);
  });
test("power passes breakable bricks once per contact but steel stays solid", () => {
  const e = playing();
  e.state.powerLeft = 8;
  hit(e, brick(3));
  assert.equal(e.state.bricks[0].hp, 2);
  assert.ok(e.state.balls[0].vy < 0);
  advance(e, 50);
  assert.equal(e.state.bricks[0].hp, 2);
  hit(e, brick(-1));
  assert.ok(e.state.balls[0].vy > 0);
});
test("wide and power timers expire on simulation time", () => {
  const e = playing();
  e.state.wideLeft = e.state.powerLeft = 0.1;
  advance(e, 200);
  assert.equal(e.paddleWidth, 90);
  assert.equal(e.state.powerLeft, 0);
});
test("losing one multiball costs nothing; losing all costs one life and resets fever", () => {
  const e = playing();
  const b = e.state.balls[0];
  e.state.balls.push({ ...b, id: 999, x: 50, y: HEIGHT + 20 });
  e.advance(STEP);
  assert.equal(e.state.lives, 3);
  assert.equal(e.state.balls.length, 1);
  e.state.feverLeft = 5;
  e.state.balls[0].y = HEIGHT + 20;
  e.advance(STEP);
  assert.equal(e.state.lives, 2);
  assert.equal(e.state.phase, "ready");
  assert.equal(e.state.feverLeft, 0);
  assert.equal(e.state.balls[0].y, PADDLE_Y - RADIUS - 1);
});
test("three misses end game and retry resets the run", () => {
  const e = playing();
  for (let n = 0; n < 3; n++) {
    advance(e, 500);
    e.launch();
    e.state.balls[0].y = HEIGHT + 20;
    e.advance(STEP);
  }
  assert.equal(e.state.lives, 0);
  assert.equal(e.state.phase, "over");
  e.start();
  assert.equal(e.state.lives, 3);
  assert.equal(e.state.score, 0);
});
test("clear ignores steel, grants bonuses once and unlocks next stage", () => {
  const e = playing();
  hit(e);
  e.state.bricks = [brick(), brick(-1, 9, 40, 60)];
  Object.assign(e.state.balls[0], {
    x: 176,
    y: 124,
    vx: 0,
    vy: -300,
    contacts: [],
  });
  e.advance(STEP);
  assert.equal(e.state.phase, "clear");
  assert.equal(e.state.highest, 2);
  assert.deepEqual(e.state.cleared, [1]);
  assert.equal(e.state.clearBonus, 500);
  assert.equal(e.state.lifeBonus, 750);
  const score = e.state.score;
  advance(e, 2000);
  assert.equal(e.state.score, score);
  e.nextStage();
  assert.equal(e.state.stage, 1);
  assert.equal(e.state.phase, "ready");
  assert.equal(e.state.score, score);
});
test("final stage shows complete and cannot advance beyond stage ten", () => {
  const e = new BlockBreakEngine();
  e.restore(10, []);
  e.start(9);
  advance(e, 500);
  e.launch();
  e.state.rowsLeft = 0;
  e.state.bricks = [brick()];
  Object.assign(e.state.balls[0], { x: 176, y: 124, vx: 0, vy: -300 });
  e.advance(STEP);
  assert.equal(e.state.phase, "complete");
  assert.equal(e.state.highest, 10);
  assert.deepEqual(e.state.cleared, [10]);
  e.nextStage();
  assert.equal(e.state.stage, 9);
});
test("pause freezes physics, powerups, combo and elapsed time without catch-up", () => {
  const e = playing();
  e.state.feverLeft = 7;
  e.movePaddle(300);
  e.pause();
  const before = JSON.stringify(e.snapshot());
  advance(e, 5000);
  e.movePaddle(0);
  assert.equal(JSON.stringify(e.snapshot()), before);
  e.resume();
  e.advance(STEP);
  assert.ok(e.state.feverLeft < 7 && e.state.feverLeft > 6.9);
});
test("large frame gap auto-pauses and restart restores stage entry score and lives", () => {
  const e = playing();
  hit(e);
  e.state.lives = 1;
  e.advance(1000);
  assert.equal(e.state.phase, "paused");
  e.restartStage();
  assert.equal(e.state.score, 0);
  assert.equal(e.state.lives, 3);
  assert.equal(e.state.combo, 0);
});
test("simulation gives matching positions at 30, 60 and 120Hz", () => {
  const simulate = (fps: number) => {
    const e = playing();
    for (let n = 0; n < fps * 2; n++) e.advance(1000 / fps);
    return e.snapshot();
  };
  const a = simulate(30),
    b = simulate(60),
    c = simulate(120);
  assert.deepEqual(a, b);
  assert.deepEqual(b, c);
});
test("feedback allocation stays bounded during large combos", () => {
  const e = playing(() => 0);
  for (let n = 0; n < 100; n++) hit(e);
  assert.ok(e.state.sparks.length <= 48);
  assert.ok(e.state.popups.length <= 8);
  assert.ok(e.state.items.length <= 6);
});
test("record parsing tolerates corrupt or out-of-range data", () => {
  assert.deepEqual(parseRecords("NaN", "{"), {
    best: 0,
    highest: 1,
    cleared: [],
  });
  assert.deepEqual(
    parseRecords(
      "500",
      JSON.stringify({ highest: 900, cleared: [0, 1, 1, 11, "2"] }),
    ),
    { best: 500, highest: 2, cleared: [1] },
  );
});
test("records use separate keys, merge concurrent saves, and survive a new store", async () => {
  const data = new Map<string, string>();
  const storage = {
    getItem: async (key: string) => data.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      data.set(key, value);
    },
  };
  const store = createRecordStore(storage);
  await Promise.all([
    store.save({ best: 500, highest: 4, cleared: [1, 2, 3] }),
    store.save({ best: 200, highest: 2, cleared: [1] }),
  ]);
  assert.deepEqual(await createRecordStore(storage).load(), {
    best: 500,
    highest: 4,
    cleared: [1, 2, 3],
  });
  assert.ok(data.has(BEST_KEY) && data.has(PROGRESS_KEY));
  assert.ok([...data.keys()].every((k) => k.startsWith("@game1000/game002/")));
});
test("storage failure does not poison later saves", async () => {
  const data = new Map<string, string>();
  let fail = true;
  const store = createRecordStore({
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => {
      if (fail) throw new Error("disk");
      data.set(key, value);
    },
  });
  await assert.rejects(store.save({ best: 100, highest: 2, cleared: [1] }));
  fail = false;
  await store.save({ best: 200, highest: 2, cleared: [1] });
  assert.equal((await store.load()).best, 200);
});

test("all ten unmodified layouts can be cleared by paddle input without items", () => {
  for (const height of [400, 500, 600, 700]) {
    for (let stage = 0; stage < STAGES.length; stage++) {
      const e = new BlockBreakEngine(() => 0.99);
      e.resize(height);
      e.restore(10, []);
      e.start(stage);
      // Vary each return angle independently of frame timing to avoid bot-created
      // repetitive orbits. Only paddle input is used; physics is untouched.
      let descending = false;
      let shot = 0;
      for (let frame = 0; frame < 60 * 900; frame++) {
        if (e.state.phase === "ready") e.launch();
        if (["over", "clear", "complete"].includes(e.state.phase)) break;
        const ball = [...e.state.balls].sort((a, b) => b.y - a.y)[0];
        if (ball && ball.vy > 0) {
          if (!descending) shot++;
          descending = true;
          const time = Math.max(0, (e.paddleY - RADIUS - ball.y) / ball.vy);
          const span = WIDTH - RADIUS * 2;
          let landing = (ball.x - RADIUS + ball.vx * time) % (span * 2);
          if (landing < 0) landing += span * 2;
          if (landing > span) landing = span * 2 - landing;
          e.movePaddle(
            landing +
              RADIUS +
              Math.sin(shot * 2.399963229728653) * e.paddleWidth * 0.4,
          );
        }
        if (ball && ball.vy < 0) descending = false;
        e.advance(1000 / 60);
      }
      assert.equal(
        e.state.phase,
        stage === 9 ? "complete" : "clear",
        `${STAGES[stage].name} height=${height}`,
      );
      assert.equal(e.state.bricks.filter((b) => b.hp > 0).length, 0);
    }
  }
});

test("developer practice permits every stage without changing normal unlocks", () => {
  const e = new BlockBreakEngine();
  for (let stage = 0; stage < STAGES.length; stage++) {
    e.start(stage, true);
    assert.equal(e.state.stage, stage);
    assert.equal(e.state.practice, true);
    assert.equal(e.state.highest, 1);
  }
  advance(e, 500);
  e.launch();
  e.state.rowsLeft = 0;
  e.state.bricks = [brick()];
  Object.assign(e.state.balls[0], { x: 176, y: 124, vx: 0, vy: -300 });
  e.advance(STEP);
  assert.equal(e.state.phase, "complete");
  assert.equal(e.state.highest, 1);
  assert.deepEqual(e.state.cleared, []);
  e.start(0);
  assert.equal(e.state.practice, false);
  e.start(9);
  assert.equal(e.state.stage, 0);
});

test("dense rows touch edge to edge; course gaps and replenishment never overlap steel", () => {
  for (let stage = 0; stage < STAGES.length; stage++) {
    assert.ok(
      STAGES[stage].rows.every((row) => row.length === COLUMNS),
      STAGES[stage].name,
    );
    assert.equal(STAGES[stage].refill.length, COLUMNS);
    const initial = buildStage(stage);
    const steel = initial.filter((b) => b.hp < 0);
    const refill = buildIncomingRow(stage, 1);
    for (let row = 0; row <= growthFloor(stage); row++)
      for (const brick of refill) {
        const y = brick.y + row * BRICK_HEIGHT;
        assert.ok(
          steel.every(
            (w) =>
              brick.x + brick.w <= w.x ||
              brick.x >= w.x + w.w ||
              y + brick.h <= w.y ||
              y >= w.y + w.h,
          ),
          STAGES[stage].name,
        );
      }
  }
  const row = buildStage(0).filter((b) => b.row === 0);
  assert.equal(row[1].x, row[0].x + row[0].w);
  assert.equal(buildStage(0).find((b) => b.row === 1)!.y, row[0].y + row[0].h);
  assert.ok(buildStage(0).length >= 60);
});
function refillGame() {
  const e = new BlockBreakEngine(() => 0.99);
  e.start(4, true);
  advance(e, 500);
  e.launch();
  Object.assign(e.state.balls[0], { x: 180, y: 400, vx: 0, vy: 0 });
  return e;
}
function eraseBottom(e: BlockBreakEngine) {
  const floor = growthFloor(e.state.stage);
  e.state.bricks = e.state.bricks.filter((b) => b.hp < 0 || b.row !== floor);
}
test("bottom-row clear adds a finite top row, shifts only bricks, and preserves walls", () => {
  const e = refillGame();
  const steel = e.state.bricks.filter((b) => b.hp < 0);
  const topId = e.state.bricks.find((b) => b.hp > 0)!.id;
  eraseBottom(e);
  advance(e, 500);
  assert.equal(e.state.rowsLeft, 4);
  advance(e, 300);
  assert.equal(e.state.rowsLeft, 3);
  assert.equal(e.state.bricks.find((b) => b.id === topId)!.row, 1);
  assert.deepEqual(
    e.state.bricks.filter((b) => b.hp < 0),
    steel,
  );
  for (let n = 0; n < 3; n++) {
    eraseBottom(e);
    advance(e, 800);
  }
  assert.equal(e.state.rowsLeft, 0);
  assert.equal(
    new Set(e.state.bricks.map((b) => b.id)).size,
    e.state.bricks.length,
  );
  eraseBottom(e);
  const count = e.state.bricks.length;
  advance(e, 1200);
  assert.equal(e.state.bricks.length, count);
  e.pause();
  e.restartStage();
  assert.equal(e.state.rowsLeft, 4);
});
test("incoming countdown pauses and spawning waits for a ball to leave the new row", () => {
  const e = refillGame();
  eraseBottom(e);
  advance(e, 200);
  e.pause();
  const pending = e.state.incomingIn;
  advance(e, 2000);
  assert.equal(e.state.incomingIn, pending);
  e.resume();
  Object.assign(e.state.balls[0], { x: 180, y: 68, vx: 0, vy: 0 });
  advance(e, 1000);
  assert.equal(e.state.rowsLeft, 4);
  e.state.balls[0].y = 400;
  advance(e, 20);
  assert.equal(e.state.rowsLeft, 3);
});
test("empty field waits for remaining rows instead of clearing early", () => {
  const e = refillGame();
  e.state.bricks = [brick()];
  Object.assign(e.state.balls[0], { x: 176, y: 124, vx: 0, vy: -300 });
  e.advance(STEP);
  assert.equal(e.state.phase, "playing");
  assert.equal(e.state.rowsLeft, 4);
  Object.assign(e.state.balls[0], { x: 180, y: 400, vx: 0, vy: 0 });
  advance(e, 800);
  assert.ok(e.state.bricks.some((b) => b.hp > 0));
  assert.equal(e.state.rowsLeft, 3);
});

test("portrait phone fields fill their width with circular geometry", () => {
  for (const [width, height] of [
    [375, 410],
    [390, 550],
    [402, 610],
    [440, 670],
  ]) {
    const layout = fieldLayout(width, height);
    assert.ok(Math.abs(WIDTH * layout.scale + 2 - width) < 1e-6);
    assert.ok(Math.abs(layout.height * layout.scale + 2 - height) < 1e-6);
    assert.ok(layout.height >= 360);
  }
});

test("adapted field survives start, launch, pause, miss and restart unchanged", () => {
  const e = new BlockBreakEngine(() => 0.99);
  e.resize(460);
  e.start();
  assert.equal(e.state.height, 460);
  assert.equal(e.state.balls[0].y, e.paddleY - RADIUS - 1);
  advance(e, 500);
  e.launch();
  e.resize(460); // A repeated layout event must not interrupt play.
  assert.equal(e.state.phase, "playing");
  Object.assign(e.state.balls[0], {
    x: e.state.paddle,
    y: e.paddleY - RADIUS - 1,
    vx: 0,
    vy: 300,
  });
  e.advance(STEP);
  assert.ok(e.state.balls[0].vy < 0);
  e.state.items = [
    { id: 900, x: e.state.paddle, y: e.paddleY - 8, kind: "wide" },
  ];
  e.advance(STEP);
  assert.ok(e.state.wideLeft > 0);
  e.pause();
  e.resume();
  e.state.balls[0].y = 480;
  e.advance(STEP);
  assert.equal(e.state.phase, "ready");
  assert.equal(e.state.lives, 2);
  assert.equal(e.state.balls[0].y, e.paddleY - RADIUS - 1);
  e.pause();
  e.restartStage();
  assert.equal(e.state.height, 460);
  assert.equal(e.state.balls[0].y, e.paddleY - RADIUS - 1);
});

test("actual viewport changes pause play and preserve score and bricks", () => {
  const e = playing();
  e.state.score = 123;
  const bricks = e.state.bricks;
  e.resize(420);
  assert.equal(e.state.phase, "paused");
  assert.equal(e.state.score, 123);
  assert.equal(e.state.bricks, bricks);
  assert.ok(e.state.balls[0].y < e.paddleY);
  e.resume();
  assert.equal(e.state.phase, "playing");
});

test("field bounds and paddle stay inside small and large portrait viewports", () => {
  // Includes compact phones, tall phones, and space reduced by enlarged HUD text.
  for (const width of [304, 344, 359, 374, 386, 424, 464]) {
    for (const availableHeight of [220, 300, 380, 450, 560, 680, 760]) {
      const { scale, height } = fieldLayout(width, availableHeight);
      assert.ok(WIDTH * scale + 2 <= width + 1e-8);
      assert.ok(height * scale + 2 <= availableHeight + 1e-8);
      const e = new BlockBreakEngine();
      e.resize(height);
      e.start();
      assert.ok((e.paddleY + 11) * scale < availableHeight - 2);
      assert.ok(e.state.balls[0].y * scale > 0);
      assert.ok(e.state.bricks.every((b) => b.y + b.h < e.paddleY));
    }
  }
});

test("unmeasured or transiently tiny viewports never produce an oversized field", () => {
  for (const [width, height] of [
    [0, 0],
    [320, 0],
    [0, 600],
    [1, 1],
    [NaN, 400],
  ]) {
    assert.equal(fieldLayout(width, height).scale, 0);
  }
  const layout = fieldLayout(3, 3);
  assert.ok(layout.scale * WIDTH + 2 <= 3);
  assert.ok(layout.scale * layout.height + 2 <= 3);
});
