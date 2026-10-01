import appConfig from "../../app.json";

// Service identity is independent of any time-limited challenge.
export const BRAND = {
  displayName: appConfig.expo.name,
  tikTokUrl: "https://www.tiktok.com/@asobit_game",
  tikTokHandle: "@asobit_game",
  reading: "アソビット",
  tagline: "スマホの中に、ゲームセンターを。",
  subTagline: "ひとりでも、みんなでも。",
} as const;
