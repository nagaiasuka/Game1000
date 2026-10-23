import { readFileSync, writeFileSync } from "node:fs";
import { CascadeEngine } from "../src/games/008/logic/engine.ts";
import { STAGES } from "../src/games/008/stages.ts";
const solutions = JSON.parse(
  readFileSync(
    new URL("../tests/cascade-solutions.json", import.meta.url),
    "utf8",
  ),
) as { stage: number; shots: { angle: number; wait: number }[] }[];
const report = solutions.map((solution) => {
  const runs = [];
  for (const offset of [-0.015, -0.0075, 0, 0.0075, 0.015]) {
    const e = new CascadeEngine(STAGES[solution.stage - 1]);
    for (const shot of solution.shots) {
      for (let t = 0; t < shot.wait - 1e-5; t += 1000 / 60)
        e.advance(1000 / 60);
      if (!e.launch(shot.angle + offset)) break;
      for (
        let f = 0;
        f < 1300 &&
        !["ready", "stage_clear", "game_over"].includes(e.state.phase);
        f++
      )
        e.advance(1000 / 60);
    }
    runs.push({
      offset,
      clear: e.state.phase === "stage_clear",
      remaining: e.state.remaining,
    });
  }
  if (!runs.find((r) => r.offset === 0)?.clear)
    throw Error(`Stage ${solution.stage} replay failed`);
  return {
    stage: solution.stage,
    nearbyClears: runs.filter((r) => r.clear).length,
    runs,
  };
});
const json = JSON.stringify(report, null, 2) + "\n";
console.log(json);
if (process.argv[2]) writeFileSync(process.argv[2], json);
