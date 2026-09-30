import { filterGames, type Game } from "./catalog.ts";
export function randomCandidates(
  catalog: readonly Game[],
  players = "all",
  favorites?: readonly string[],
): Game[] {
  return filterGames(catalog, players).filter(
    (g) => g.status === "available" && (!favorites || favorites.includes(g.id)),
  );
}
export function pickRandomGame(
  candidates: readonly Game[],
  previous?: string,
  random = Math.random,
): Game | null {
  const available = candidates.filter((g) => g.status === "available");
  const pool =
    available.length > 1
      ? available.filter((g) => g.id !== previous)
      : available;
  if (!pool.length) return null;
  const value = random();
  const index = Math.floor(
    Math.max(
      0,
      Math.min(1 - Number.EPSILON, Number.isFinite(value) ? value : 0),
    ) * pool.length,
  );
  return pool[index];
}
