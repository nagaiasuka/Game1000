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

export function challengeCalendar(today: string, startDate: string, durationDays: number) {
  const elapsed = dayNumber(today) - dayNumber(startDate);
  const endDate = new Date((dayNumber(startDate) + durationDays - 1) * DAY_MS)
    .toISOString().slice(0, 10);
  const phase = elapsed < 0 ? "upcoming" : elapsed >= durationDays ? "complete" : "active";
  const day = Math.min(durationDays, Math.max(0, elapsed + 1));
  return {
    day,
    dayLabel: `DAY ${String(day).padStart(2, "0")} / ${durationDays}`,
    endDate,
    phase,
  };
}

export function projectProgress(catalog: readonly Game[], target: number) {
  const available = availableCount(catalog);
  return {
    available,
    achieved: available >= target,
    countLabel: `${String(Math.min(available, target)).padStart(3, "0")} / ${String(target).padStart(3, "0")}`,
    remaining: Math.max(0, target - available),
    percent: Math.min(100, Math.max(0, (available / target) * 100)),
  };
}

export function japaneseDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return `${year}年${month}月${day}日`;
}
