export const BEST_KEY = "@game1000/game002/best-score/v1";
export const PROGRESS_KEY = "@game1000/game002/stages/v1";
export type Records = { best: number; highest: number; cleared: number[] };
type Storage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
};
const stageNumber = (n: unknown): n is number =>
  Number.isInteger(n) && Number(n) >= 1 && Number(n) <= 10;
export function parseRecords(
  best: string | null,
  progress: string | null,
): Records {
  let data: { highest?: unknown; cleared?: unknown } = {};
  try {
    const value = JSON.parse(progress ?? "{}");
    if (value && typeof value === "object") data = value;
  } catch {}
  const cleared = Array.isArray(data.cleared)
    ? [...new Set(data.cleared.filter(stageNumber))]
    : [];
  return {
    best:
      best && /^\d+$/.test(best) && Number.isSafeInteger(Number(best))
        ? Number(best)
        : 0,
    highest: Math.max(
      stageNumber(data.highest) ? data.highest : 1,
      ...cleared.map((n) => Math.min(10, n + 1)),
    ),
    cleared,
  };
}
export function createRecordStore(storage: Storage) {
  let pending: Promise<unknown> = Promise.resolve();
  const read = async () => {
    const [best, progress] = await Promise.all([
      storage.getItem(BEST_KEY),
      storage.getItem(PROGRESS_KEY),
    ]);
    return parseRecords(best, progress);
  };
  return {
    async load() {
      await pending.catch(() => {});
      return read();
    },
    save(records: Records): Promise<Records> {
      const input = { ...records, cleared: [...records.cleared] };
      const task = pending
        .catch(() => {})
        .then(async () => {
          const previous = await read();
          const safe = parseRecords(String(input.best), JSON.stringify(input));
          const next = {
            best: Math.max(previous.best, safe.best),
            highest: Math.max(previous.highest, safe.highest),
            cleared: [...new Set([...previous.cleared, ...safe.cleared])].sort(
              (a, b) => a - b,
            ),
          };
          if (next.best !== previous.best)
            await storage.setItem(BEST_KEY, String(next.best));
          if (
            next.highest !== previous.highest ||
            next.cleared.length !== previous.cleared.length
          )
            await storage.setItem(
              PROGRESS_KEY,
              JSON.stringify({ highest: next.highest, cleared: next.cleared }),
            );
          return next;
        });
      pending = task;
      return task;
    },
  };
}
