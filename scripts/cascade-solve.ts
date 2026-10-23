/** Searches real launch inputs through the production engine; no state or damage shortcuts. */
import { writeFileSync } from "node:fs";
import { CascadeEngine } from "../src/games/008/logic/engine.ts";
import { STAGES } from "../src/games/008/stages.ts";
const wanted = Number(process.argv[2] ?? 0);
const results = [];
for (const stage of STAGES.filter((s) => !wanted || s.id === wanted)) {
  let beam = [
    {
      engine: new CascadeEngine(stage),
      shots: [] as { angle: number; wait: number }[],
    },
  ];
  let solution: (typeof beam)[number] | undefined;
  const start = performance.now();
  for (let depth = 0; depth < stage.shots && !solution; depth++) {
    const candidates: typeof beam = [];
    const clears: typeof beam = [];
    for (const node of beam)
      for (let a = -21; a <= 21; a++)
        for (const wait of stage.id === 7 && depth === 0
          ? [0, 600, 1200]
          : [0]) {
          const e = node.engine.fork();
          for (let t = 0; t < wait; t += 1000 / 60) e.advance(1000 / 60);
          const angle = a * 0.05;
          if (!e.launch(angle)) continue;
          for (
            let frame = 0;
            frame < 1300 &&
            !["ready", "stage_clear", "game_over"].includes(e.state.phase);
            frame++
          )
            e.advance(1000 / 60);
          const n = {
            engine: e,
            shots: [...node.shots, { angle: Number(angle.toFixed(3)), wait }],
          };
          if (e.state.phase === "stage_clear") {
            clears.push(n);
          }
          if (e.state.phase === "ready") candidates.push(n);
        }
    const robustness = (shots: (typeof beam)[number]["shots"]) => {
      let successes = 0;
      for (const offset of [-0.02, -0.01, 0.01, 0.02]) {
        const e = new CascadeEngine(stage);
        for (const shot of shots) {
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
        if (e.state.phase === "stage_clear") successes++;
      }
      return successes;
    };
    solution = clears
      .map((node) => ({ node, nearby: robustness(node.shots) }))
      .sort(
        (a, b) =>
          b.nearby - a.nearby ||
          b.node.engine.state.score - a.node.engine.state.score,
      )[0]?.node;
    const rank = (e: CascadeEngine) =>
      e.state.stage.bricks.reduce((n, b) => n + b.hp, 0) * 100 +
      e.state.remaining * 25 -
      (e.state.open ? 100 : 0) -
      e.state.fever * 2;
    candidates.sort(
      (a, b) =>
        rank(a.engine) - rank(b.engine) ||
        b.engine.state.score - a.engine.state.score,
    );
    const seen = new Set<string>();
    beam = candidates
      .filter((n) => {
        const key =
          n.engine.state.stage.bricks.map((b) => b.hp).join(",") +
          ":" +
          n.engine.state.open +
          ":" +
          Math.round(n.engine.state.fever);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 5);
    console.log(
      `stage ${stage.id}, depth ${depth + 1}, best remaining ${beam[0]?.engine.state.remaining ?? "-"}, solution ${!!solution}`,
    );
  }
  if (!solution) throw Error(`No legal solution found for stage ${stage.id}`);
  const result = {
    stage: stage.id,
    shots: solution.shots,
    score: solution.engine.state.score,
    stars: solution.engine.state.stars,
    peak: solution.engine.state.peakBalls,
  };
  results.push(result);
  console.log(
    JSON.stringify({
      ...result,
      searchMs: Math.round(performance.now() - start),
    }),
  );
}
if (!wanted)
  writeFileSync(
    new URL("../tests/cascade-solutions.json", import.meta.url),
    JSON.stringify(results, null, 2) + "\n",
  );
