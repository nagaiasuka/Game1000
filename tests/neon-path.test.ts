import test from "node:test";
import assert from "node:assert/strict";
import {
  applyTurn,
  canStep,
  createMatch,
  legalMoves,
  shortestPath,
  wallError,
  type Match,
  type Player,
  type Wall,
} from "../src/games/004/logic/engine.ts";
import {
  initialSession,
  sessionReducer,
} from "../src/games/004/logic/session.ts";
import { pathSound } from "../src/games/004/audio.ts";
import { sceneEffects } from "../src/audio/types.ts";
const locations = (m: Match) =>
  legalMoves(m)
    .map((p) => `${p.row},${p.col}`)
    .sort();
const wall = (
  row: number,
  col: number,
  orientation: Wall["orientation"] = "horizontal",
): Wall => ({ row, col, orientation, owner: 1 });
test("004 starts on a 9x9 board with ten walls and two reachable goals", () => {
  const m = createMatch();
  assert.deepEqual(m.pawns, { 1: { row: 8, col: 4 }, 2: { row: 0, col: 4 } });
  assert.deepEqual(m.remaining, { 1: 10, 2: 10 });
  assert.equal(shortestPath(m, 1), 8);
  assert.equal(shortestPath(m, 2), 8);
  assert.deepEqual(locations(m), ["7,4", "8,3", "8,5"]);
});
test("moves cannot leave the board, go diagonally or occupy an opponent", () => {
  const m = createMatch();
  for (const target of [
    { row: 9, col: 4 },
    { row: 7, col: 5 },
    { row: 0, col: 4 },
  ])
    assert.equal(applyTurn(m, { type: "move", target }), null);
  assert.equal(canStep({ row: 4, col: 4 }, { row: 4, col: 4 }, []), false);
});
test("each wall closes exactly two edges, in both directions", () => {
  for (const orientation of ["horizontal", "vertical"] as const) {
    const w = wall(3, 3, orientation);
    for (let i = 0; i < 2; i++) {
      const a =
        orientation === "horizontal"
          ? { row: 3, col: 3 + i }
          : { row: 3 + i, col: 3 };
      const b =
        orientation === "horizontal"
          ? { row: 4, col: 3 + i }
          : { row: 3 + i, col: 4 };
      assert.equal(canStep(a, b, [w]), false);
      assert.equal(canStep(b, a, [w]), false);
    }
    assert.equal(canStep({ row: 0, col: 0 }, { row: 0, col: 1 }, [w]), true);
  }
});
test("opponent can be jumped in all four directions, without a diagonal shortcut", () => {
  for (const [dr, dc] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    const m = {
      ...createMatch(),
      pawns: { 1: { row: 4, col: 4 }, 2: { row: 4 + dr, col: 4 + dc } },
    };
    const moves = legalMoves(m);
    assert.ok(moves.some((p) => p.row === 4 + 2 * dr && p.col === 4 + 2 * dc));
    assert.equal(moves.length, 4);
    assert.ok(!moves.some((p) => p.row === 4 + dr && p.col === 4 + dc));
  }
});
test("blocked jump enables sideways detour, but cannot cross another wall", () => {
  const m = {
    ...createMatch(),
    pawns: { 1: { row: 4, col: 4 }, 2: { row: 3, col: 4 } },
    walls: [wall(2, 4), wall(3, 3, "vertical")],
  };
  assert.deepEqual(locations(m), ["3,5", "4,5", "5,4"]);
});
test("edge of board enables sideways detours; wall before opponent prevents jumping", () => {
  const m = {
    ...createMatch(),
    pawns: { 1: { row: 1, col: 4 }, 2: { row: 0, col: 4 } },
  };
  assert.ok(locations(m).includes("0,3"));
  assert.ok(locations(m).includes("0,5"));
  assert.deepEqual(locations({ ...m, walls: [wall(0, 4)] }), [
    "1,3",
    "1,5",
    "2,4",
  ]);
});
test("wall overlap, partial overlap and crossing are illegal; touching ends is legal", () => {
  for (const orientation of ["horizontal", "vertical"] as const) {
    const m = { ...createMatch(), walls: [wall(3, 3, orientation)] };
    assert.equal(wallError(m, wall(3, 3, orientation)), "overlap");
    assert.equal(
      wallError(
        m,
        wall(3, 3, orientation === "horizontal" ? "vertical" : "horizontal"),
      ),
      "overlap",
    );
    assert.equal(
      wallError(
        m,
        wall(
          orientation === "horizontal" ? 3 : 4,
          orientation === "horizontal" ? 4 : 3,
          orientation,
        ),
      ),
      "overlap",
    );
    assert.equal(
      wallError(
        m,
        wall(
          orientation === "horizontal" ? 3 : 5,
          orientation === "horizontal" ? 5 : 3,
          orientation,
        ),
      ),
      null,
    );
  }
});
test("BFS forbids fully enclosing either player and leaves input unchanged", () => {
  for (const trapped of [1, 2] as const) {
    const m = createMatch();
    m.pawns[trapped] = { row: 4, col: 3 };
    m.walls = [wall(3, 3), wall(4, 3), wall(3, 2, "vertical")];
    const saved = JSON.stringify(m);
    assert.notEqual(shortestPath(m, trapped), null);
    assert.equal(wallError(m, wall(4, 4, "vertical")), "blocked");
    assert.equal(
      applyTurn(m, { type: "wall", wall: wall(4, 4, "vertical") }),
      null,
    );
    assert.equal(JSON.stringify(m), saved);
  }
});
test("wall requires inventory and integral in-board anchors", () => {
  const m = createMatch();
  for (const w of [wall(-1, 0), wall(8, 0), wall(0, 8), wall(1.1, 0)])
    assert.equal(wallError(m, w), "outside");
  m.remaining[1] = 0;
  assert.equal(wallError(m, wall(3, 3)), "empty");
});
test("placing a wall consumes one turn and one wall, immutably", () => {
  const m = createMatch();
  const n = applyTurn(m, { type: "wall", wall: wall(3, 3) })!;
  assert.equal(n.turn, 2);
  assert.equal(n.moves, 1);
  assert.equal(n.remaining[1], 9);
  assert.equal(n.remaining[2], 10);
  assert.equal(m.walls.length, 0);
  assert.equal(m.remaining[1], 10);
});
test("both players win on any column of their opposite edge; finished games reject actions", () => {
  for (const p of [1, 2] as const)
    for (const col of [0, 4, 8]) {
      const m = createMatch(p);
      m.pawns[p] = { row: p === 1 ? 1 : 7, col };
      m.pawns[p === 1 ? 2 : 1] = { row: 4, col: 8 };
      const n = applyTurn(m, {
        type: "move",
        target: { row: p === 1 ? 0 : 8, col },
      })!;
      assert.equal(n.winner, p);
      assert.deepEqual(legalMoves(n), []);
      assert.equal(applyTurn(n, { type: "wall", wall: wall(3, 3) }), null);
    }
});
test("undo restores pawn, turn and wall inventory, and cannot be repeated", () => {
  let s = sessionReducer(initialSession(), { type: "start" });
  const first = s.match;
  s = sessionReducer(s, {
    type: "act",
    revision: s.revision,
    action: { type: "wall", wall: wall(3, 3) },
  });
  assert.equal(s.event?.kind, "wall");
  s = sessionReducer(s, { type: "undo", revision: s.revision });
  assert.deepEqual(s.match, first);
  assert.equal(s.previous, null);
  assert.equal(sessionReducer(s, { type: "undo", revision: s.revision }), s);
  s = sessionReducer(s, {
    type: "act",
    revision: s.revision,
    action: { type: "move", target: { row: 7, col: 4 } },
  });
  assert.ok(s.previous);
  s = sessionReducer(s, { type: "undo", revision: s.revision });
  assert.deepEqual(s.match, first);
});
test("stale double-taps cannot apply another turn, including after undo", () => {
  let s = sessionReducer(initialSession(), { type: "start" });
  const revision = s.revision;
  s = sessionReducer(s, {
    type: "act",
    revision,
    action: { type: "move", target: { row: 7, col: 4 } },
  });
  const n = sessionReducer(s, {
    type: "act",
    revision,
    action: { type: "move", target: { row: 1, col: 4 } },
  });
  assert.equal(n, s);
  s = sessionReducer(s, { type: "undo", revision: s.revision });
  assert.equal(
    sessionReducer(s, {
      type: "act",
      revision,
      action: { type: "move", target: { row: 7, col: 4 } },
    }),
    s,
  );
});
test("victory cannot be undone and rematch alternates first player with a fresh board", () => {
  let s = sessionReducer(initialSession(), { type: "start" });
  s = {
    ...s,
    match: {
      ...s.match!,
      pawns: { 1: { row: 1, col: 0 }, 2: { row: 5, col: 4 } },
    },
  };
  s = sessionReducer(s, {
    type: "act",
    revision: s.revision,
    action: { type: "move", target: { row: 0, col: 0 } },
  });
  assert.equal(s.event?.kind, "goal");
  assert.equal(s.previous, null);
  assert.equal(sessionReducer(s, { type: "undo", revision: s.revision }), s);
  s = sessionReducer(s, { type: "start" });
  assert.equal(s.match?.first, 2);
  assert.equal(s.match?.walls.length, 0);
});
test("rejected wall produces warning with no changed turn or lost undo", () => {
  let s = sessionReducer(initialSession(), { type: "start" });
  s = sessionReducer(s, {
    type: "act",
    revision: s.revision,
    action: { type: "wall", wall: wall(3, 3) },
  });
  const previous = s.previous,
    match = s.match;
  s = sessionReducer(s, {
    type: "act",
    revision: s.revision,
    action: { type: "wall", wall: wall(3, 3) },
  });
  assert.equal(s.event?.kind, "warning");
  assert.equal(s.error, "overlap");
  assert.equal(s.match, match);
  assert.equal(s.previous, previous);
});
test("004 effects are registered and goal/jump/wall have distinct cues", () => {
  for (const event of [
    "start",
    "move",
    "jump",
    "wall",
    "goal",
    "warning",
    "undo",
  ] as const)
    assert.ok(sceneEffects["004"].includes(pathSound(event)));
  assert.equal(
    new Set([
      pathSound("move"),
      pathSound("jump"),
      pathSound("wall"),
      pathSound("goal"),
    ]).size,
    4,
  );
});
// Independent edge graph checks reachability after randomized legal play.
function reachable(m: Match, p: Player) {
  const blocked = new Set<string>();
  for (const w of m.walls)
    for (let i = 0; i < 2; i++) {
      const a =
        w.orientation === "horizontal"
          ? w.row * 9 + w.col + i
          : (w.row + i) * 9 + w.col;
      const b = a + (w.orientation === "horizontal" ? 9 : 1);
      blocked.add(`${a}:${b}`);
      blocked.add(`${b}:${a}`);
    }
  const start = m.pawns[p].row * 9 + m.pawns[p].col,
    seen = new Set([start]),
    queue = [start];
  for (const a of queue) {
    if (Math.floor(a / 9) === (p === 1 ? 0 : 8)) return true;
    for (const b of [
      a - 9,
      a + 9,
      ...(a % 9 > 0 ? [a - 1] : []),
      ...(a % 9 < 8 ? [a + 1] : []),
    ])
      if (b >= 0 && b < 81 && !seen.has(b) && !blocked.has(`${a}:${b}`)) {
        seen.add(b);
        queue.push(b);
      }
  }
  return false;
}
test("seeded matches preserve two routes, wall counts and turn invariants", () => {
  let seed = 104;
  const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  for (let run = 0; run < 50; run++) {
    let m = createMatch();
    for (let step = 0; step < 160 && !m.winner; step++) {
      const before = m,
        player = m.turn;
      let n: Match | null = null;
      if (random() < 0.55)
        n = applyTurn(m, {
          type: "wall",
          wall: wall(
            Math.floor(random() * 8),
            Math.floor(random() * 8),
            random() < 0.5 ? "horizontal" : "vertical",
          ),
        });
      if (!n) {
        const options = legalMoves(m);
        assert.ok(options.length);
        n = applyTurn(m, {
          type: "move",
          target: options[Math.floor(random() * options.length)],
        });
      }
      assert.ok(n);
      m = n;
      assert.equal(m.moves, before.moves + 1);
      assert.ok(reachable(m, 1));
      assert.ok(reachable(m, 2));
      assert.equal(m.remaining[1] + m.remaining[2] + m.walls.length, 20);
      if (!m.winner) assert.notEqual(m.turn, player);
    }
  }
});
