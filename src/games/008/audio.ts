import type { Effect } from "../../audio/types.ts";
import type { Events } from "./logic/types.ts";
const HITS: readonly Effect[] = [
  "cascadeHit1",
  "cascadeHit2",
  "cascadeHit3",
  "cascadeHit4",
  "cascadeHit5",
  "cascadeHit6",
];
/** Bounded counters in, at most two normal cues out; no delayed collision queue. */
export class CascadeAudioDirector {
  private lastHit = -Infinity;
  private lastSpecial = -Infinity;
  reset() {
    this.lastHit = this.lastSpecial = -Infinity;
  }
  consume(
    events: Events,
    combo: number,
    time: number,
    lastStage = false,
  ): Effect[] {
    if (events.clear) return [lastStage ? "cascadeWin" : "cascadeClear"];
    if (events.over) return ["cascadeOver"];
    if (events.fever) return ["cascadeFever"];
    if (events.start) return ["start"];
    const result: Effect[] = [];
    if (time - this.lastSpecial >= 0.15) {
      if (events.bomb) result.push("cascadeBomb");
      else if (events.gate) result.push("cascadeGate");
      else if (events.bumper) result.push("cascadeBumper");
      else if (events.feverEnd) result.push("cascadeFeverEnd");
      if (result.length) this.lastSpecial = time;
    }
    if ((events.hit || events.broken) && time - this.lastHit >= 0.085) {
      result.push(HITS[Math.min(5, Math.floor(combo / 4))]);
      this.lastHit = time;
    }
    return result;
  }
}
