export const FAVORITES_KEY = "@game1000/favorites/v1";
export function parseFavorites(raw: string | null): string[] {
  try {
    const value = JSON.parse(raw ?? "[]");
    return Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (id): id is string =>
                typeof id === "string" && /^\d{3,}$/.test(id),
            ),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}
export class FavoritesStore {
  private storage: {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<unknown>;
  };
  private queue: Promise<unknown> = Promise.resolve();
  constructor(storage: FavoritesStore["storage"]) {
    this.storage = storage;
  }
  async load() {
    return parseFavorites(await this.storage.getItem(FAVORITES_KEY));
  }
  save(ids: readonly string[]) {
    const value = JSON.stringify([...new Set(ids)]);
    const operation = this.queue
      .catch(() => {})
      .then(() => this.storage.setItem(FAVORITES_KEY, value));
    this.queue = operation;
    return operation;
  }
}
