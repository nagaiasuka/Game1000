import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AudioManager, type Player } from "../src/audio/audio-manager.ts";
import {
  DEFAULT_AUDIO,
  readSettings,
  comboSound,
  sceneEffects,
} from "../src/audio/types.ts";
import type { Effect } from "../src/audio/types.ts";
import type { SoundId } from "../src/audio/sounds.ts";
import { dropSounds } from "../src/games/001/audio.ts";
import { breakSounds } from "../src/games/002/audio.ts";
import { stackSound } from "../src/games/003/audio.ts";
import {
  initialState,
  BlockDropEngine,
} from "../src/games/001/logic/engine.ts";
import { BlockBreakEngine } from "../src/games/002/logic/engine.ts";
const manifest = JSON.parse(
  readFileSync(
    new URL("../assets/audio/manifest.json", import.meta.url),
    "utf8",
  ),
);
const durations = Object.fromEntries(
  Object.entries(manifest).map(([id, v]) => [id, (v as { ms: number }).ms]),
) as Record<SoundId, number>;
function harness(delayed = false) {
  let now = 1000;
  const all: Fake[] = [],
    pending: (() => void)[] = [];
  class Fake implements Player {
    volume = 0;
    loop = false;
    isLoaded = true;
    removed = false;
    until = 0;
    starts = 0;
    id: SoundId;
    constructor(id: SoundId) {
      this.id = id;
    }
    play() {
      assert.ok(!this.removed);
      this.starts++;
      this.until = this.loop ? Infinity : now + durations[this.id];
    }
    pause() {
      this.until = 0;
    }
    seekTo() {
      return delayed
        ? new Promise<void>((resolve) => pending.push(resolve))
        : Promise.resolve();
    }
    remove() {
      this.removed = true;
      this.until = 0;
    }
  }
  const manager = new AudioManager(
    (id) => {
      const p = new Fake(id);
      all.push(p);
      return p;
    },
    durations,
    () => now,
  );
  return {
    manager,
    all,
    pending,
    tick: (ms: number) => {
      now += ms;
    },
    sounding: () => all.filter((p) => !p.removed && p.until > now),
    starts: (id: SoundId) =>
      all.filter((p) => p.id === id).reduce((sum, p) => sum + p.starts, 0),
  };
}
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};
test("settings retain independent toggles, clamp volume, tolerate corrupted data", () => {
  assert.deepEqual(readSettings("invalid"), DEFAULT_AUDIO);
  assert.deepEqual(readSettings("null"), DEFAULT_AUDIO);
  assert.deepEqual(
    readSettings('{"bgm":false,"se":true,"bgmVolume":-1,"seVolume":2}'),
    { bgm: false, se: true, bgmVolume: 0, seVolume: 1 },
  );
});
test("startup is silent until settings load; BGM and effects are independent", async () => {
  const h = harness();
  h.manager.play("ui");
  assert.equal(h.all.length, 0);
  h.manager.configure({ ...DEFAULT_AUDIO, bgm: false });
  h.manager.initialize();
  assert.equal(h.starts("bgmhome"), 0);
  h.manager.play("ui");
  await flush();
  assert.equal(h.starts("ui"), 1);
  h.manager.configure({ ...DEFAULT_AUDIO, se: false });
  h.manager.play("start");
  await flush();
  assert.equal(h.starts("start"), 0);
  assert.equal(h.starts("bgmhome"), 1);
  h.manager.dispose();
  assert.ok(h.all.every((p) => p.removed));
});
test("background, mute, scene change and disposal cancel pending effect seeks", async () => {
  for (const stop of ["background", "mute", "scene", "dispose"]) {
    const h = harness(true);
    h.manager.initialize();
    h.manager.play("ui");
    if (stop === "background") h.manager.setActive(false);
    if (stop === "mute") h.manager.configure({ ...DEFAULT_AUDIO, se: false });
    if (stop === "scene") h.manager.setScene("003");
    if (stop === "dispose") h.manager.dispose();
    h.pending.forEach((resolve) => resolve());
    await flush();
    assert.equal(h.starts("ui"), 0);
    h.manager.dispose();
  }
});
test("slow seeks and unloaded sources do not produce late feedback", async () => {
  const h = harness(true);
  h.manager.initialize();
  h.manager.play("ui");
  h.tick(200);
  h.pending.forEach((resolve) => resolve());
  await flush();
  assert.equal(h.starts("ui"), 0);
  for (const p of h.all) p.isLoaded = false;
  h.manager.play("start");
  assert.equal(h.pending.length, 1);
  h.manager.dispose();
});
test("returning to foreground does not resume BGM for a paused game", () => {
  const h = harness();
  h.manager.setScene("002");
  h.manager.initialize();
  h.manager.setPaused("002", true);
  h.manager.setActive(false);
  h.manager.setActive(true);
  assert.equal(h.sounding().length, 0);
  h.manager.setPaused("002", false);
  assert.equal(h.sounding().filter((p) => p.id === "bgm002").length, 1);
  h.manager.dispose();
});
test("10000 break events keep four-voice ceiling and allocate no players during play", async () => {
  const h = harness();
  h.manager.setScene("002");
  h.manager.initialize();
  const allocated = h.all.length;
  for (let i = 0; i < 10000; i++) {
    h.manager.play(comboSound(i % 25));
    if (i % 17 === 0) h.manager.play("multi", 2);
    if (i % 31 === 0) h.manager.play("fever", 3);
    await flush();
    assert.ok(h.sounding().filter((p) => !p.loop).length <= 4);
    assert.equal(h.all.length, allocated);
    h.tick(8);
  }
  assert.ok(allocated <= 24);
  assert.ok(h.starts("break1") > 1);
  assert.ok(h.starts("break4") > 1);
  h.manager.dispose();
});
test("critical jingles displace minor effects but minor effects cannot displace them", async () => {
  const h = harness();
  h.manager.setScene("002");
  h.manager.initialize();
  for (const id of ["multi", "wide", "power", "pickup"] as Effect[])
    h.manager.play(id, 1);
  await flush();
  h.manager.play("allClear", 3);
  await flush();
  assert.equal(h.starts("allClear"), 1);
  h.manager.play("miss", 1);
  await flush();
  assert.equal(h.starts("miss"), 0);
  h.manager.dispose();
});
test("rapid route changes release old pools and never overlap BGM tracks", async () => {
  const h = harness();
  h.manager.initialize();
  for (const scene of ["001", "002", "003", "home"] as const) {
    h.manager.setScene(scene);
    h.tick(140);
    await new Promise((resolve) => setTimeout(resolve, 25));
    assert.ok(h.sounding().filter((p) => p.loop).length <= 1);
    assert.ok(h.all.filter((p) => !p.removed).length <= 24);
  }
  h.manager.dispose();
  assert.ok(h.all.every((p) => p.removed));
});
test("scene definitions resolve real WAVs with bounded peaks and no missing cues", () => {
  for (const sounds of Object.values(sceneEffects))
    for (const id of sounds) assert.ok(manifest[id]);
  for (const info of Object.values(manifest) as {
    path: string;
    ms: number;
  }[]) {
    const wav = readFileSync(
      new URL("../assets/audio/" + info.path, import.meta.url),
    );
    assert.equal(wav.toString("ascii", 0, 4), "RIFF");
    assert.equal(wav.readUInt32LE(24), 22050);
    for (let i = 44; i < wav.length; i += 2)
      assert.ok(Math.abs(wav.readInt16LE(i)) <= 25560);
    if (info.path.endsWith("bgm.wav"))
      assert.ok(
        Math.abs(wav.readInt16LE(44) - wav.readInt16LE(wav.length - 2)) < 2500,
      );
  }
});
test("game mappings distinguish line counts, combo tiers, piece sizes and finales", () => {
  assert.deepEqual(
    [1, 2, 3, 4].map(
      (n) =>
        dropSounds(
          [n === 4 ? "four" : "clear"],
          { ...initialState(), clearingRows: Array(n).fill(0) },
          false,
        )[0],
    ),
    ["line1", "line2", "line3", "line4"],
  );
  assert.deepEqual(dropSounds(["drop", "lock"], initialState(), false), [
    "drop",
  ]);
  assert.deepEqual(dropSounds(["over"], initialState(), true), ["best"]);
  assert.deepEqual([1, 5, 10, 20].map(comboSound), [
    "break1",
    "break2",
    "break3",
    "break4",
  ]);
  const e = new BlockBreakEngine();
  assert.deepEqual(breakSounds(["clear"], { ...e.state, phase: "complete" }), [
    "allClear",
  ]);
  assert.deepEqual(breakSounds(["item", "wide"], e.state), ["pickup", "wide"]);
  assert.deepEqual(
    [1, 2, 3].map((n) => stackSound("place", n as 1 | 2 | 3)),
    ["place1", "place2", "place3"],
  );
  assert.equal(stackSound("undo"), "ui");
});
test("drop emits successful input sounds and one start at end of countdown", () => {
  const e = new BlockDropEngine(() => 0.5);
  e.start();
  for (let i = 0; i < 210; i++) e.advance(1000 / 60);
  assert.equal(e.drainEvents().filter((x) => x === "start").length, 1);
  e.input("rotate");
  assert.ok(e.drainEvents().includes("rotate"));
  e.input("left");
  assert.ok(e.drainEvents().includes("move"));
  e.pause();
  e.input("rotate");
  assert.deepEqual(e.drainEvents(), []);
});

test("game intros keep home music; starting changes only music and keeps prepared effects", async () => {
  for (const scene of ["001", "002", "003"] as const) {
    const h = harness();
    h.manager.initialize();
    h.manager.setScene(scene, "home");
    assert.equal(h.starts("bgmhome"), 2); // Same player continues; no duplicate track.
    assert.equal(h.all.filter((p) => p.id === "bgmhome").length, 1);
    assert.equal(h.starts(`bgm${scene}`), 0);
    const effects = h.all.filter((p) => !p.removed && !p.loop);
    h.manager.setMusic(scene, scene);
    h.tick(140);
    await new Promise((resolve) => setTimeout(resolve, 25));
    assert.equal(h.starts(`bgm${scene}`), 1);
    assert.ok(effects.every((p) => !p.removed));
    assert.equal(h.sounding().filter((p) => p.loop).length, 1);
    h.manager.setScene("home");
    h.tick(140);
    await new Promise((resolve) => setTimeout(resolve, 25));
    assert.equal(h.sounding().find((p) => p.loop)?.id, "bgmhome");
    h.manager.dispose();
  }
});

test("return to stage selection restores home music; inactive games cannot change current music", async () => {
  const h = harness();
  h.manager.setScene("002");
  h.manager.initialize();
  h.manager.setMusic("002", "home");
  h.tick(140);
  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.equal(h.sounding().find((p) => p.loop)?.id, "bgmhome");
  h.manager.setMusic("001", "001");
  assert.equal(h.sounding().find((p) => p.loop)?.id, "bgmhome");
  h.manager.dispose();
});
