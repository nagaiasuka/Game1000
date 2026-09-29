export type GameCategory =
  | "brain"
  | "reflex"
  | "psychology"
  | "party"
  | "luck"
  | "puzzle"
  | "board"
  | "quiz"
  | "card";
export type Game = {
  id: string;
  gameNumber: number;
  title: string;
  shortDescription: string;
  minPlayers: number;
  maxPlayers: number;
  estimatedMinutes?: number;
  mode?: "endless";
  categories: GameCategory[];
  thumbnail?: string;
  artwork?: "block-drop" | "block-break";
  isNew?: boolean;
  isPopular?: boolean;
} & (
  { status: "coming-soon" } | { status: "available"; route: `/play/${string}` }
);
// Only available entries count toward the collection and can be launched.
export const games: Game[] = [
  {
    id: "001",
    gameNumber: 1,
    title: "テトリス BLOCK DROP",
    shortDescription: "ブロックを積んで、ラインを消せ。",
    minPlayers: 1,
    maxPlayers: 1,
    categories: ["puzzle"],
    mode: "endless",
    artwork: "block-drop",
    isNew: true,
    status: "available",
    route: "/play/001",
  },
  {
    id: "002",
    gameNumber: 2,
    title: "BLOCK BREAK",
    shortDescription: "壊すたび、気持ちいい。10ステージのブロック崩し。",
    minPlayers: 1,
    maxPlayers: 1,
    categories: ["reflex"],
    artwork: "block-break",
    isNew: true,
    status: "available",
    route: "/play/002",
  },
  {
    id: "003",
    gameNumber: 3,
    title: "COMING SOON",
    shortDescription: "みんなが集まれば、ゲームの時間。",
    minPlayers: 3,
    maxPlayers: 10,
    categories: ["party"],
    status: "coming-soon",
  },
];
export const playerOptions = [
  { id: "1", label: "1人", caption: "SOLO", min: 1, max: 1 },
  { id: "2", label: "2人", caption: "DUO", min: 2, max: 2 },
  { id: "3-4", label: "3〜4人", caption: "GROUP", min: 3, max: 4 },
  { id: "5+", label: "5人以上", caption: "PARTY", min: 5, max: Infinity },
] as const;
export function availableCount(catalog: readonly Game[]) {
  return catalog.filter((g) => g.status === "available").length;
}
export function filterGames(
  catalog: readonly Game[],
  players?: string,
  collection?: string,
) {
  const group = playerOptions.find((p) => p.id === players);
  return catalog.filter(
    (g) =>
      (!group || (g.minPlayers <= group.max && g.maxPlayers >= group.min)) &&
      (collection !== "popular" || g.isPopular) &&
      (collection !== "new" || g.isNew),
  );
}
