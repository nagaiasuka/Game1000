import { applyMove, createMatch, key, validSelection } from "./engine.ts";
import type { Hex, Match, Move } from "./engine.ts";
export type Feedback =
  "start" | "select" | "move" | "push" | "blocked" | "push_out" | "win";
export type Session = {
  match: Match | null;
  selection: Hex[];
  revision: number;
  event: {
    kind: Feedback;
    move?: Move;
    id: number;
  } | null;
};
export const initialSession = (): Session => ({
  match: null,
  selection: [],
  revision: 0,
  event: null,
});
export type Action =
  | {
      type: "start";
    }
  | {
      type: "select";
      cell: Hex;
      revision: number;
    }
  | {
      type: "move";
      direction: Hex;
      revision: number;
    };
export function sessionReducer(s: Session, a: Action): Session {
  const event = (kind: Feedback, move?: Move) => ({
    kind,
    move,
    id: (s.event?.id ?? 0) + 1,
  });
  if (a.type === "start")
    return {
      match: createMatch(),
      selection: [],
      revision: s.revision + 1,
      event: event("start"),
    };
  if (!s.match || s.match.winner || a.revision !== s.revision) return s;
  if (a.type === "select") {
    if (s.match.board[key(a.cell)] !== s.match.turn)
      return { ...s, event: event("blocked") };
    const selected = s.selection.some((h) => key(h) === key(a.cell));
    const next = selected
      ? s.selection.filter((h) => key(h) !== key(a.cell))
      : [...s.selection, a.cell];
    if (next.length && !validSelection(s.match, next))
      return selected
        ? { ...s, selection: [], event: event("select") }
        : { ...s, event: event("blocked") };
    return { ...s, selection: next, event: event("select") };
  }
  const result = applyMove(s.match, s.selection, a.direction);
  if (!result) return { ...s, event: event("blocked") };
  return {
    match: result.match,
    selection: [],
    revision: s.revision + 1,
    event: event(
      result.match.winner
        ? "win"
        : result.move.out
          ? "push_out"
          : result.move.pushed
            ? "push"
            : "move",
      result.move,
    ),
  };
}
