import test from "node:test";
import assert from "node:assert/strict";
import { games } from "../src/data/catalog.ts";
import { randomCandidates, pickRandomGame } from "../src/data/random-game.ts";
import { FavoritesStore, parseFavorites } from "../src/favorites/store.ts";

test("random selection intersects players and favorites and excludes unreleased games", () => {
  assert.deepEqual(
    randomCandidates(games, "2", ["001", "003"]).map((g) => g.id),
    ["003"],
  );
  assert.deepEqual(randomCandidates(games, "all", []), []);
  assert.deepEqual(randomCandidates(games, "5+"), []);
  assert.equal(
    randomCandidates([
      ...games,
      { ...games[0], id: "099", status: "coming-soon" },
    ]).length,
    5,
  );
});
test("draw reaches every candidate without immediately repeating the previous game", () => {
  for (let i = 0; i < games.length; i++)
    assert.equal(
      pickRandomGame(games, undefined, () => i / games.length)?.id,
      games[i].id,
    );
  for (let i = 0; i < 20; i++)
    assert.notEqual(pickRandomGame(games, "003", () => i / 20)?.id, "003");
  assert.equal(pickRandomGame([games[0]], "001")?.id, "001");
  assert.equal(pickRandomGame([]), null);
  assert.equal(pickRandomGame([{ ...games[0], status: "coming-soon" }]), null);
});
test("favorites recover malformed values and preserve valid unique IDs", () => {
  assert.deepEqual(parseFavorites(null), []);
  assert.deepEqual(parseFavorites("broken"), []);
  assert.deepEqual(parseFavorites("{}"), []);
  assert.deepEqual(parseFavorites('["001","001",2,null,"invalid","100"]'), [
    "001",
    "100",
  ]);
});
test("rapid saves stay ordered and survive a new store instance", async () => {
  let saved: string | null = null;
  let release!: () => void;
  let calls = 0;
  const storage = {
    getItem: async () => saved,
    setItem: async (_key: string, value: string) => {
      calls++;
      if (calls === 1)
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      saved = value;
    },
  };
  const store = new FavoritesStore(storage);
  const first = store.save(["001"]);
  const second = store.save(["002"]);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls, 1);
  release();
  await Promise.all([first, second]);
  assert.deepEqual(await new FavoritesStore(storage).load(), ["002"]);
  await store.save([]);
  assert.deepEqual(await store.load(), []);
});
test("failed storage operations propagate and do not prevent retries", async () => {
  let fail = true;
  let value: string | null = null;
  const store = new FavoritesStore({
    getItem: async () => {
      if (fail) throw Error("offline");
      return value;
    },
    setItem: async (_key, v) => {
      if (fail) throw Error("full");
      value = v;
    },
  });
  await assert.rejects(store.load());
  await assert.rejects(store.save(["001"]));
  fail = false;
  await store.save(["003"]);
  assert.deepEqual(await store.load(), ["003"]);
});
