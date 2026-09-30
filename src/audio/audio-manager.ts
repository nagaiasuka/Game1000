import { DEFAULT_AUDIO, sceneEffects } from "./types.ts";
import type { AudioSettings, Effect, Scene } from "./types.ts";
import type { SoundId } from "./sounds.ts";
export interface Player {
  volume: number;
  loop: boolean;
  isLoaded: boolean;
  play(): void;
  pause(): void;
  seekTo(seconds: number): Promise<void>;
  remove(): void;
}
type Voice = {
  player: Player;
  sound: Effect;
  until: number;
  token: number;
  priority: number;
};
/** Owns a bounded, scene-local pool. No React updates or player creation on collision. */
export class AudioManager {
  private settings = { ...DEFAULT_AUDIO };
  private ready = false;
  private active = true;
  private scene: Scene = "home";
  private music: Partial<Record<Scene, Scene>> = {};
  private paused: Partial<Record<Scene, boolean>> = {};
  private voices: Voice[] = [];
  private bgm: Player | null = null;
  private bgmScene: Scene | null = null;
  private fade: ReturnType<typeof setInterval> | null = null;
  private last = new Map<string, number>();
  private create: (id: SoundId) => Player;
  private durations: Record<SoundId, number>;
  private now: () => number;
  constructor(
    create: (id: SoundId) => Player,
    durations: Record<SoundId, number>,
    now = Date.now,
  ) {
    this.create = create;
    this.durations = durations;
    this.now = now;
  }
  private safe(action: () => void) {
    try {
      action();
    } catch {
      /* Audio must never interrupt play. */
    }
  }
  configure(settings: AudioSettings) {
    this.settings = settings;
    if (!settings.se) this.stopEffects();
    this.syncBgm();
  }
  initialize() {
    if (this.ready) return;
    this.ready = true;
    this.loadEffects();
    this.syncBgm();
  }
  setScene(scene: Scene, music: Scene = scene) {
    if (scene === this.scene) {
      this.setMusic(scene, music);
      return;
    }
    this.music[scene] = music;
    this.scene = scene;
    this.unloadEffects();
    this.last.clear();
    if (this.ready) this.loadEffects();
    this.syncBgm();
  }
  // BGM selection is separate from the preloaded gameplay effect pool.
  setMusic(scene: Scene, music: Scene) {
    if ((this.music[scene] ?? scene) === music) return;
    this.music[scene] = music;
    if (scene === this.scene) this.syncBgm();
  }
  setPaused(scene: Scene, paused: boolean) {
    if (this.paused[scene] === paused) return;
    this.paused[scene] = paused;
    if (scene === this.scene) {
      if (paused) this.stopEffects();
      this.syncBgm();
    }
  }
  setActive(active: boolean) {
    if (this.active === active) return;
    this.active = active;
    if (!active) this.stopEffects();
    this.syncBgm();
  }
  private loadEffects() {
    for (const sound of sceneEffects[this.scene]) {
      const copies = sound.startsWith("break") ? 2 : 1;
      for (let i = 0; i < copies; i++)
        this.safe(() => {
          const player = this.create(sound);
          player.volume = this.settings.seVolume;
          this.voices.push({ sound, player, until: 0, token: 0, priority: 0 });
        });
    }
  }
  play(sound: Effect, priority = 1) {
    if (!this.ready || !this.active || !this.settings.se) return;
    const now = this.now();
    const group = sound.startsWith("break") ? "break" : sound;
    const cooldown =
      group === "break"
        ? 45
        : sound === "move"
          ? 110
          : sound === "ui"
            ? 70
            : 50;
    if (now - (this.last.get(group) ?? -Infinity) < cooldown) return;
    const available = this.voices.filter(
      (v) => v.sound === sound && v.player.isLoaded,
    );
    const voice = available.find((v) => v.until <= now);
    if (!voice) return;
    const busy = this.voices.filter((v) => v.until > now);
    if (busy.length >= 4) {
      const victim = busy.sort(
        (a, b) => a.priority - b.priority || a.until - b.until,
      )[0];
      if (victim.priority >= priority) return;
      this.stopVoice(victim);
    }
    this.last.set(group, now);
    voice.until = now + this.durations[sound] + 120;
    voice.priority = priority;
    const token = ++voice.token;
    this.safe(() => {
      voice.player.pause();
      void voice.player
        .seekTo(0)
        .then(() => {
          if (
            voice.token !== token ||
            !this.ready ||
            !this.active ||
            !this.settings.se
          )
            return;
          // Discard stale feedback after a slow seek instead of sounding on a later move.
          if (this.now() - now > 120) {
            voice.until = 0;
            return;
          }
          this.safe(() => {
            voice.player.volume = this.settings.seVolume;
            voice.player.play();
          });
        })
        .catch(() => {
          if (voice.token === token) voice.until = 0;
        });
    });
  }
  private stopVoice(v: Voice) {
    v.token++;
    v.until = 0;
    this.safe(() => {
      v.player.volume = 0;
      v.player.pause();
    });
  }
  private stopEffects() {
    this.voices.forEach((v) => this.stopVoice(v));
  }
  private unloadEffects() {
    this.stopEffects();
    this.voices.forEach((v) => this.safe(() => v.player.remove()));
    this.voices = [];
  }
  private cancelFade() {
    if (this.fade) clearInterval(this.fade);
    this.fade = null;
  }
  private removeBgm() {
    if (this.bgm)
      this.safe(() => {
        this.bgm!.pause();
        this.bgm!.remove();
      });
    this.bgm = null;
    this.bgmScene = null;
  }
  private ramp(to: number, done?: () => void) {
    this.cancelFade();
    const player = this.bgm;
    if (!player) {
      done?.();
      return;
    }
    const from = player.volume,
      start = this.now();
    this.fade = setInterval(() => {
      const t = Math.min(1, (this.now() - start) / 120);
      this.safe(() => {
        player.volume = from + (to - from) * t;
      });
      if (t >= 1) {
        this.cancelFade();
        done?.();
      }
    }, 20);
  }
  private syncBgm() {
    const music = this.music[this.scene] ?? this.scene;
    this.cancelFade();
    if (
      !this.ready ||
      !this.active ||
      !this.settings.bgm ||
      this.paused[this.scene]
    ) {
      if (this.bgm)
        this.safe(() => {
          this.bgm!.volume = 0;
          this.bgm!.pause();
        });
      if (this.bgmScene !== music) this.removeBgm();
      return;
    }
    if (this.bgm && this.bgmScene !== music) {
      this.ramp(0, () => {
        this.removeBgm();
        this.syncBgm();
      });
      return;
    }
    if (!this.bgm)
      this.safe(() => {
        this.bgm = this.create(`bgm${music}`);
        this.bgmScene = music;
        this.bgm.loop = true;
        this.bgm.volume = 0;
      });
    if (this.bgm) {
      this.safe(() => this.bgm!.play());
      this.ramp(this.settings.bgmVolume);
    }
  }
  dispose() {
    this.ready = false;
    this.cancelFade();
    this.unloadEffects();
    this.removeBgm();
    this.last.clear();
  }
}
