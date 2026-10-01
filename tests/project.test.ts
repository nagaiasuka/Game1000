import test from "node:test";
import assert from "node:assert/strict";
import { games, type Game } from "../src/data/catalog.ts";
import { CHALLENGE } from "../src/data/challenge.ts";
import { calendarDate, challengeCalendar, projectProgress } from "../src/utils/project.ts";

const calendar = (today: string) => challengeCalendar(today, CHALLENGE.startDate, CHALLENGE.durationDays);
test("challenge starts at DAY 01 and includes the full 100th Japanese day", () => {
  assert.equal(calendar("2026-09-30").phase, "upcoming");
  assert.equal(calendar("2026-09-30").day, 0);
  assert.equal(calendar("2026-10-01").dayLabel, "DAY 01 / 100");
  assert.equal(calendar("2026-10-02").dayLabel, "DAY 02 / 100");
  assert.equal(calendar("2027-01-08").dayLabel, "DAY 100 / 100");
  assert.equal(calendar("2027-01-08").phase, "active");
  assert.equal(calendar("2027-01-09").phase, "complete");
  assert.equal(calendar("2028-01-01").day, 100);
  assert.equal(calendar("2026-10-01").endDate, "2027-01-08");
});
test("Japanese midnight is independent of device timezone, including completion", () => {
  for (const [instant, expected] of [
    ["2026-09-30T14:59:59Z", "2026-09-30"],
    ["2026-09-30T15:00:00Z", "2026-10-01"],
    ["2026-10-01T00:00:00+09:00", "2026-10-01"],
    ["2026-09-30T08:00:00-07:00", "2026-10-01"],
    ["2027-01-08T14:59:59Z", "2027-01-08"],
    ["2027-01-08T15:00:00Z", "2027-01-09"],
  ]) assert.equal(calendarDate(new Date(instant), CHALLENGE.timeZone), expected);
});
test("calendar arithmetic includes leap days and ignores DST", () => {
  assert.equal(challengeCalendar("2028-03-01", "2028-02-28", 100).day, 3);
  assert.equal(challengeCalendar("2027-03-15", "2027-03-13", 100).day, 3);
});
for (const count of [0, 5, 29, 30, 31, 100]) {
  test(`challenge counts ${count} available games and permits games beyond thirty`, () => {
    const available: Game[] = Array.from({ length: count }, (_, i) => ({ ...games[0], id: String(i), gameNumber: i + 1 }));
    const result = projectProgress([...available, { ...games[0], status: "coming-soon" }], CHALLENGE.targetGames);
    assert.equal(result.available, count);
    assert.equal(result.countLabel, `${String(Math.min(count, 30)).padStart(3, "0")} / 030`);
    assert.equal(result.achieved, count >= 30);
    assert.equal(result.remaining, Math.max(0, 30 - count));
    assert.equal(result.percent, Math.min(100, count / 30 * 100));
  });
}
test("early completion and period completion are independent", () => {
  assert.equal(projectProgress(Array.from({ length: 30 }, () => games[0]), 30).achieved, true);
  assert.equal(calendar("2026-10-02").phase, "active");
  assert.equal(projectProgress(games, 30).achieved, false);
  assert.equal(calendar("2027-01-09").phase, "complete");
});
