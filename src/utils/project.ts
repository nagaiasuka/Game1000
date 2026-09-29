import { availableCount, type Game } from "../data/catalog.ts";

const DAY_MS = 86_400_000;

// Calendar dates become UTC ordinals; neither DST nor device timezone affects subtraction.
function dayNumber(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / DAY_MS;
}

export function calendarDate(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function deadlineProgress(today: string, deadline: string) {
  const difference = dayNumber(deadline) - dayNumber(today);
  return { daysLeft: Math.max(0, difference), expired: difference < 0 };
}

export function projectProgress(catalog: readonly Game[], target: number) {
  const available = availableCount(catalog);
  return {
    available,
    countLabel: `${String(available).padStart(3, "0")} / ${target}`,
    remaining: Math.max(0, target - available),
    percent: Math.min(100, Math.max(0, (available / target) * 100)),
  };
}

export function japaneseDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return `${year}年${month}月${day}日`;
}
