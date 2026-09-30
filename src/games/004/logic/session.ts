import {
  applyTurn,
  createMatch,
  other,
  wallError,
  type Match,
  type TurnAction,
  type Failure,
} from "./engine.ts";
export type Feedback =
  "start" | "move" | "jump" | "wall" | "goal" | "warning" | "undo";
export type Session = {
  match: Match | null;
  previous: Match | null;
  revision: number;
  error: Failure | null;
  event: { id: number; kind: Feedback } | null;
};
export const initialSession = (): Session => ({
  match: null,
  previous: null,
  revision: 0,
  error: null,
  event: null,
});
export type Action =
  | { type: "start" }
  | { type: "undo"; revision: number }
  | { type: "act"; action: TurnAction; revision: number };
export function sessionReducer(state: Session, action: Action): Session {
  const revision = state.revision + 1;
  const event = (kind: Feedback) => ({ id: revision, kind });
  if (action.type === "start")
    return {
      match: createMatch(state.match ? other(state.match.first) : 1),
      previous: null,
      revision,
      error: null,
      event: event("start"),
    };
  if (!state.match || state.match.winner || action.revision !== state.revision)
    return state;
  if (action.type === "undo")
    return state.previous
      ? {
          ...state,
          match: state.previous,
          previous: null,
          revision,
          error: null,
          event: event("undo"),
        }
      : state;
  const next = applyTurn(state.match, action.action);
  if (!next)
    return {
      ...state,
      revision,
      error:
        action.action.type === "wall"
          ? wallError(state.match, action.action.wall)
          : "move",
      event: event("warning"),
    };
  const player = state.match.turn;
  const before = state.match.pawns[player],
    after = next.pawns[player];
  const kind = next.winner
    ? "goal"
    : action.action.type === "wall"
      ? "wall"
      : Math.abs(before.row - after.row) + Math.abs(before.col - after.col) > 1
        ? "jump"
        : "move";
  return {
    match: next,
    previous: next.winner ? null : state.match,
    revision,
    error: null,
    event: event(kind),
  };
}
