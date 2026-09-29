export const BEST_KEY = "@game1000/game001/best-score/v1";
export type ScoreStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
};
export function parseBest(value: string | null): number {
  if (!value || !/^\d+$/.test(value)) return 0;
  const score = Number(value);
  return Number.isSafeInteger(score) && score >= 0 ? score : 0;
}
/** Serializes read/modify/write, including writes from a quickly restarted screen. */
export function createBestStore(storage: ScoreStorage) {
  let pending: Promise<unknown> = Promise.resolve();
  return {
    async load() {
      await pending.catch(() => {});
      return parseBest(await storage.getItem(BEST_KEY));
    },
    save(score: number): Promise<number> {
      const task = pending
        .catch(() => {})
        .then(async () => {
          const previous = parseBest(await storage.getItem(BEST_KEY));
          const next = Math.max(
            previous,
            Number.isSafeInteger(score) && score >= 0 ? score : 0,
          );
          if (next > previous) await storage.setItem(BEST_KEY, String(next));
          return next;
        });
      pending = task;
      return task;
    },
  };
}
