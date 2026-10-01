import appConfig from "../../app.json";

// Service identity is independent of any time-limited challenge.
export const BRAND = {
  displayName: appConfig.expo.name,
  reading: "アソビット",
  tagline: "スマホの中に、ゲームセンターを。",
  subTagline: "ひとりでも、みんなでも。",
} as const;
