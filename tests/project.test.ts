import test from "node:test";
import assert from "node:assert/strict";
import { games, type Game } from "../src/data/catalog.ts";
import {
  calendarDate,
  deadlineProgress,
  projectProgress,
} from "../src/utils/project.ts";

for (const count of [1, 20, 100]) {
  test(`project counts ${count} published games without counting previews`, () => {
    const catalog: Game[] = [
      ...Array.from({ length: count }, (_, i): Game => ({
        ...games[0],
        id: String(i),
        gameNumber: i + 1,
        status: "available",
        route: "/play/001",
      })),
      ...games.filter((g) => g.status === "coming-soon"),
    ];
    const result = projectProgress(catalog, 100);
    assert.equal(result.countLabel, `${String(count).padStart(3, "0")} / 100`);
    assert.equal(result.remaining, 100 - count);
    assert.equal(result.percent, count);
  });
}
test("empty and over-target catalogs keep progress within bounds", () => {
  assert.equal(projectProgress([], 100).percent, 0);
  const result = projectProgress(
    Array.from({ length: 101 }, () => games[0]),
    100,
  );
  assert.equal(result.percent, 100);
  assert.equal(result.remaining, 0);
  assert.equal(result.available, 101);
});
test("deadline before, on, and after the final day", () => {
  assert.deepEqual(deadlineProgress("2030-12-30", "2030-12-31"), {
    daysLeft: 1,
    expired: false,
  });
  assert.deepEqual(deadlineProgress("2030-12-31", "2030-12-31"), {
    daysLeft: 0,
    expired: false,
  });
  assert.deepEqual(deadlineProgress("2031-01-01", "2030-12-31"), {
    daysLeft: 0,
    expired: true,
  });
  assert.equal(deadlineProgress("2026-09-29", "2030-12-31").daysLeft, 1554);
});
test("calendar arithmetic includes leap day and ignores DST", () => {
  assert.equal(deadlineProgress("2028-02-28", "2028-03-01").daysLeft, 2);
  assert.equal(deadlineProgress("2030-03-09", "2030-03-11").daysLeft, 2);
});
test("project date changes at Japanese midnight regardless of source timezone", () => {
  const tz = "Asia/Tokyo";
  assert.equal(
    calendarDate(new Date("2030-12-30T14:59:59Z"), tz),
    "2030-12-30",
  );
  assert.equal(
    calendarDate(new Date("2030-12-30T15:00:00Z"), tz),
    "2030-12-31",
  );
  assert.equal(
    calendarDate(new Date("2030-12-30T07:00:00-08:00"), tz),
    "2030-12-31",
  );
  assert.equal(
    calendarDate(new Date("2030-12-31T15:00:00Z"), tz),
    "2031-01-01",
  );
});
