import { applyMove, createMatch } from "./engine.ts";
import type { Match, MoveError, PieceSize, Player } from "./types.ts";
export type Feedback = "place" | "cover" | "win" | "draw" | "warning";
export type Session = {
  history: { match: Match; wins: Record<Player, number>; rounds: number }[];
  match: Match | null;
  selected: PieceSize | null;
  wins: Record<Player, number>;
  rounds: number;
  error: MoveError | "choose-size" | null;
  event: { id: number; kind: Feedback } | null;
};
export const initialSession = (): Session => ({
  history: [],
  match: null,
  selected: null,
  wins: { 1: 0, 2: 0 },
  rounds: 0,
  error: null,
  event: null,
});
export type Action =
  | { type: "start"; first: Player }
  | { type: "undo"; expectedMoves: number }
  | { type: "select"; size: PieceSize }
  | { type: "place"; cell: number; expectedMoves: number };
export function sessionReducer(state: Session, action: Action): Session {
  const event = (kind: Feedback) => ({ id: (state.event?.id ?? 0) + 1, kind });
  if (action.type === "start")
    return {
      ...state,
      history: [],
      match: createMatch(action.first),
      selected: null,
      error: null,
      event: null,
    };
  const match = state.match;
  if (action.type === "undo") {
    const previous = state.history.at(-1);
    if (!previous || !match || action.expectedMoves !== match.moves)
      return state;
    return {
      ...state,
      ...previous,
      history: state.history.slice(0, -1),
      selected: null,
      error: null,
      event: event("place"),
    };
  }
  if (!match || match.phase !== "playing") return state;
  if (action.type === "select") {
    if (match.inventory[match.turn][action.size] <= 0)
      return { ...state, error: "empty-hand", event: event("warning") };
    return { ...state, selected: action.size, error: null };
  }
  // Ignore a second tap from the previous render/turn.
  if (action.expectedMoves !== match.moves) return state;
  if (!state.selected)
    return { ...state, error: "choose-size", event: event("warning") };
  const result = applyMove(match, {
    player: match.turn,
    size: state.selected,
    cell: action.cell,
  });
  if (!result.ok)
    return { ...state, error: result.error, event: event("warning") };
  const next = result.match;
  return {
    ...state,
    history: [
      ...state.history,
      { match, wins: state.wins, rounds: state.rounds },
    ],
    match: next,
    selected: null,
    error: null,
    rounds: state.rounds + (next.phase !== "playing" ? 1 : 0),
    wins: next.winner
      ? { ...state.wins, [next.winner]: state.wins[next.winner] + 1 }
      : state.wins,
    event: event(
      next.phase === "won"
        ? "win"
        : next.phase === "draw"
          ? "draw"
          : next.captured
            ? "cover"
            : "place",
    ),
  };
}
