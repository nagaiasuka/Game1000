import test from "node:test";
import assert from "node:assert/strict";
import { wallAt, isDrag } from "../src/games/004/logic/gestures.ts";
import {
  initialSession,
  sessionReducer,
} from "../src/games/004/logic/session.ts";
test("drag coordinates account for screen offsets and each board size", () => {
  for (const size of [180, 280, 418]) {
    const rect = { x: 21, y: 193, width: size, height: size };
    assert.deepEqual(
      wallAt(21 + (size * 4) / 9, 193 + (size * 5) / 9, rect, "vertical"),
      { row: 4, col: 3, orientation: "vertical" },
    );
    assert.equal(wallAt(20, 200, rect, "horizontal"), null);
    assert.equal(wallAt(22, 194 + size, rect, "horizontal"), null);
    assert.deepEqual(wallAt(21 + size, 193 + size, rect, "horizontal"), {
      row: 7,
      col: 7,
      orientation: "horizontal",
    });
  }
  assert.equal(
    wallAt(0, 0, { x: 0, y: 0, width: 0, height: 0 }, "horizontal"),
    null,
  );
});
test("tap slop keeps minor finger movement as rotation instead of dropping", () => {
  assert.equal(isDrag({ x: 10, y: 20 }, { x: 13, y: 24 }), false);
  assert.equal(isDrag({ x: 10, y: 20 }, { x: 10, y: 29 }), true);
});
test("valid drop changes turn once; rejected drop keeps wall inventory and turn", () => {
  let s = sessionReducer(initialSession(), { type: "start" });
  const wall = wallAt(
    140,
    140,
    { x: 0, y: 0, width: 315, height: 315 },
    "horizontal",
  )!;
  const revision = s.revision;
  s = sessionReducer(s, {
    type: "act",
    revision,
    action: { type: "wall", wall },
  });
  assert.equal(s.match?.turn, 2);
  assert.equal(s.match?.remaining[1], 9);
  assert.equal(
    sessionReducer(s, {
      type: "act",
      revision,
      action: { type: "wall", wall },
    }),
    s,
  );
  s = sessionReducer(s, {
    type: "act",
    revision: s.revision,
    action: { type: "wall", wall },
  });
  assert.equal(s.match?.turn, 2);
  assert.equal(s.match?.remaining[2], 10);
});
