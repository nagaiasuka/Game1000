export type PlayerCount = 2 | 3 | 4;
export const PLAYER_COLORS = [
  "#00E5FF",
  "#FF2BD6",
  "#FFE600",
  "#A855F7",
] as const;
export type Phase =
  | "choosing"
  | "casting"
  | "hooked"
  | "lifting"
  | "stretching"
  | "caught"
  | "finished";
export type Fish = { id: number; blocks: number; caught: boolean };
export type Match = {
  players: PlayerCount;
  first: number;
  turn: number;
  fish: Fish[];
  scores: number[];
  catches: number[][];
  selected: number | null;
  phase: Phase;
  revealed: number;
  completed: number;
  overtake: boolean;
  event: {
    id: number;
    kind:
      "start" | "select" | "hook" | "lift" | "block" | "catch" | "turn" | "win";
  };
};
export function createMatch(
  players: PlayerCount,
  first = 0,
  random = Math.random,
): Match {
  const lengths =
    players === 3 ? [2, 3, 4, 5, 5, 6, 7, 8, 9] : [2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = lengths.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.max(0, Math.floor(random() * (i + 1))));
    [lengths[i], lengths[j]] = [lengths[j], lengths[i]];
  }
  return {
    players,
    first: first % players,
    turn: first % players,
    fish: lengths.map((blocks, id) => ({ id, blocks, caught: false })),
    scores: Array(players).fill(0),
    catches: Array.from({ length: players }, () => []),
    selected: null,
    phase: "choosing",
    revealed: 0,
    completed: 0,
    overtake: false,
    event: { id: 1, kind: "start" },
  };
}
export type Action =
  | { type: "select"; id: number }
  | { type: "advance" }
  | { type: "lift" }
  | { type: "next" };
function event(match: Match, kind: Match["event"]["kind"]) {
  return { id: match.event.id + 1, kind };
}
export function reducer(match: Match, action: Action): Match {
  if (action.type === "select") {
    if (
      match.phase !== "choosing" ||
      !match.fish.some((f) => f.id === action.id && !f.caught)
    )
      return match;
    return {
      ...match,
      selected: action.id,
      phase: "casting",
      event: event(match, "select"),
    };
  }
  if (action.type === "lift")
    return match.phase === "hooked"
      ? { ...match, phase: "lifting", event: event(match, "lift") }
      : match;
  if (action.type === "advance") {
    if (match.phase === "casting")
      return { ...match, phase: "hooked", event: event(match, "hook") };
    if (match.phase === "lifting" || match.phase === "stretching") {
      const fish = match.fish.find((f) => f.id === match.selected)!;
      if (match.revealed < fish.blocks)
        return {
          ...match,
          phase: "stretching",
          revealed: match.revealed + 1,
          event: event(match, "block"),
        };
      const scores = match.scores.map(
        (s, i) => s + (i === match.turn ? fish.blocks : 0),
      );
      const overtake = match.scores.some(
        (s, i) =>
          i !== match.turn &&
          s > match.scores[match.turn] &&
          scores[match.turn] > s,
      );
      return {
        ...match,
        scores,
        overtake,
        completed: match.completed + 1,
        phase: "caught",
        catches: match.catches.map((v, i) =>
          i === match.turn ? [...v, fish.blocks] : v,
        ),
        fish: match.fish.map((f) =>
          f.id === fish.id ? { ...f, caught: true } : f,
        ),
        event: event(match, "catch"),
      };
    }
  }
  if (action.type === "next" && match.phase === "caught") {
    if (match.completed === match.fish.length)
      return { ...match, phase: "finished", event: event(match, "win") };
    return {
      ...match,
      turn: (match.turn + 1) % match.players,
      selected: null,
      revealed: 0,
      overtake: false,
      phase: "choosing",
      event: event(match, "turn"),
    };
  }
  return match;
}
export function rankings(scores: readonly number[]) {
  return scores
    .map((score, player) => ({
      player,
      score,
      rank: 1 + scores.filter((s) => s > score).length,
    }))
    .sort((a, b) => b.score - a.score || a.player - b.player);
}
/** Includes flight and final hold; the final size is never used by the drawing code. */
export function stepDelay(match: Match) {
  if (match.phase === "casting") return 260;
  if (match.phase === "lifting") return 200;
  const n = match.fish.find((f) => f.id === match.selected)?.blocks ?? 2;
  const total = n <= 3 ? 800 : n <= 6 ? 1200 : n <= 8 ? 1700 : 2000;
  if (n === 9) return match.revealed === 8 ? 320 : 185;
  return (total - 200) / n;
}
