export const THEME_KEY = "@game1000/settings/theme/v1";
export const MAIN_COLORS = [
  { id: "cyan", label: "ネオンシアン", color: "#00F5FF" },
  { id: "mint", label: "ミント", color: "#68F5B5" },
  { id: "lavender", label: "ラベンダー", color: "#C4ACFF" },
  { id: "amber", label: "アンバー", color: "#FFD078" },
  { id: "rose", label: "ローズ", color: "#FF94C8" },
] as const;
export type MainColor = (typeof MAIN_COLORS)[number]["id"];
export function readMainColor(raw: string | null): MainColor {
  try {
    const id = JSON.parse(raw ?? "{}").mainColor;
    return MAIN_COLORS.find((c) => c.id === id)?.id ?? "cyan";
  } catch {
    return "cyan";
  }
}
/** Remap only the main UI accent, including alpha suffixes; preserve gameplay colors. */
export function tintStyles<T>(value: T, accent: string): T {
  if (typeof value === "string")
    return (
      /^#00F5FF(?:[0-9a-fA-F]{2})?$/.test(value)
        ? accent + value.slice(7)
        : value
    ) as T;
  if (Array.isArray(value))
    return value.map((item) => tintStyles(item, accent)) as T;
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        tintStyles(item, accent),
      ]),
    ) as T;
  return value;
}
