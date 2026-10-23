export const RECORDS_KEY = "@game1000/game008/records/v1";
export type StageRecord = { score: number; stars: number };
export type Records = {
  highest: number;
  stages: Record<number, StageRecord>;
  endlessBest: number;
  endlessWave: number;
  reducedEffects: boolean;
};
export const initialRecords = (): Records => ({
  highest: 1,
  stages: {},
  endlessBest: 0,
  endlessWave: 1,
  reducedEffects: false,
});
const integer = (x: unknown, fallback = 0) =>
  typeof x === "number" && Number.isSafeInteger(x) && x >= 0 ? x : fallback;
export function parseRecords(raw: string | null): Records {
  const fallback = initialRecords();
  try {
    const v: unknown = JSON.parse(raw ?? "{}");
    if (!v || typeof v !== "object" || Array.isArray(v)) return fallback;
    const data = v as Record<string, unknown>,
      stages: Records["stages"] = {};
    if (
      data.stages &&
      typeof data.stages === "object" &&
      !Array.isArray(data.stages)
    )
      for (const [key, value] of Object.entries(data.stages)) {
        const id = Number(key);
        if (
          !Number.isInteger(id) ||
          id < 1 ||
          id > 10 ||
          !value ||
          typeof value !== "object"
        )
          continue;
        const record = value as Record<string, unknown>;
        stages[id] = {
          score: integer(record.score),
          stars: Math.min(3, integer(record.stars)),
        };
      }
    const cleared = Object.entries(stages)
      .filter(([, r]) => r.stars > 0)
      .map(([id]) => Number(id) + 1);
    return {
      highest: Math.min(10, Math.max(1, integer(data.highest, 1), ...cleared)),
      stages,
      endlessBest: integer(data.endlessBest),
      endlessWave: Math.max(1, integer(data.endlessWave, 1)),
      reducedEffects:
        typeof data.reducedEffects === "boolean" ? data.reducedEffects : false,
    };
  } catch {
    return fallback;
  }
}
export function mergeRecords(a: Records, b: Records): Records {
  const clean = parseRecords(JSON.stringify(b)),
    stages = { ...a.stages };
  for (const [id, r] of Object.entries(clean.stages)) {
    const old = stages[Number(id)];
    stages[Number(id)] = {
      score: Math.max(old?.score ?? 0, r.score),
      stars: Math.max(old?.stars ?? 0, r.stars),
    };
  }
  return parseRecords(
    JSON.stringify({
      ...clean,
      stages,
      highest: Math.max(a.highest, clean.highest),
      endlessBest: Math.max(a.endlessBest, clean.endlessBest),
      endlessWave: Math.max(a.endlessWave, clean.endlessWave),
    }),
  );
}
export function createRecordStore(storage: {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<unknown>;
}) {
  let pending: Promise<unknown> = Promise.resolve();
  return {
    async load() {
      await pending.catch(() => {});
      return parseRecords(await storage.getItem(RECORDS_KEY));
    },
    save(input: Records): Promise<Records> {
      const copy = parseRecords(JSON.stringify(input));
      const task = pending
        .catch(() => {})
        .then(async () => {
          const next = mergeRecords(
            parseRecords(await storage.getItem(RECORDS_KEY)),
            copy,
          );
          await storage.setItem(RECORDS_KEY, JSON.stringify(next));
          return next;
        });
      pending = task;
      return task;
    },
  };
}
