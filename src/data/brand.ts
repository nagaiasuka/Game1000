import appConfig from "../../app.json";

// Display branding only. Repository, native IDs and storage keys stay unchanged.
export const GAME_TARGET = 100;
export const BRAND = {
  displayName: appConfig.expo.name,
  reading: "ゲームヒャク",
  targetGames: GAME_TARGET,
} as const;
