import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSharedValue } from "react-native-reanimated";
import { audio } from "@/audio/native";
import { CascadeEngine } from "./logic/engine";
import { MAX_BALLS, gateX } from "./logic/types";
import { STAGES, endlessStage } from "./stages";
import { CascadeAudioDirector } from "./audio";
import { recordStore } from "./storage";
import { initialRecords, mergeRecords, type Records } from "./storage/records";

export function snapshot(engine: CascadeEngine) {
  const s = engine.state;
  return {
    phase: s.phase,
    mode: s.mode,
    stage: { ...s.stage, bricks: s.stage.bricks.map((b) => ({ ...b })) },
    score: s.score,
    combo: s.combo,
    maxCombo: s.maxCombo,
    fever: s.fever,
    feverLeft: s.feverLeft,
    remaining: s.remaining,
    used: s.used,
    shotsLeft: engine.shotsLeft,
    activeBalls: engine.activeBalls,
    peakBalls: s.peakBalls,
    angle: s.angle,
    open: s.open,
    stars: s.stars,
    sparks: s.sparks.map((p) => ({ ...p })),
    shotTime: s.shotTime,
  };
}
export type Hud = ReturnType<typeof snapshot>;
function pack(engine: CascadeEngine) {
  const s = engine.state,
    frame = Array<number>(MAX_BALLS * 4 + 6).fill(0);
  s.balls.forEach((b, i) => {
    const j = i * 4;
    frame[j] = b.x;
    frame[j + 1] = b.y;
    frame[j + 2] = Number(b.active);
    frame[j + 3] = Math.atan2(b.vy, b.vx);
  });
  for (const gate of s.stage.gates)
    frame[MAX_BALLS * 4 + gate.id] = gateX(gate, s.time);
  return frame;
}
export function useNeonCascade() {
  const [engine, setEngine] = useState(() => new CascadeEngine(STAGES[0]));
  const [hud, setHud] = useState(() => snapshot(engine));
  const [started, setStarted] = useState(false);
  const [records, setRecords] = useState(initialRecords);
  const [loaded, setLoaded] = useState(false),
    [storageError, setStorageError] = useState("");
  const recordsRef = useRef(initialRecords());
  const mounted = useRef(false),
    focused = useRef(false),
    saved = useRef<CascadeEngine | null>(null);
  const [director] = useState(() => new CascadeAudioDirector());
  const frame = useSharedValue(pack(engine));
  const persist = useCallback((update: (previous: Records) => Records) => {
    const next = update(recordsRef.current);
    recordsRef.current = next;
    setRecords(next);
    void recordStore
      .save(next)
      .then((value) => {
        if (!mounted.current) return;
        const merged = mergeRecords(value, recordsRef.current);
        recordsRef.current = merged;
        setRecords(merged);
        setStorageError("");
      })
      .catch(() => {
        if (mounted.current)
          setStorageError(
            "記録を保存できませんでした。今回の進捗はアプリを閉じるまで保持します。",
          );
      });
  }, []);
  useEffect(() => {
    mounted.current = true;
    void recordStore
      .load()
      .then((value) => {
        if (mounted.current) {
          recordsRef.current = value;
          setRecords(value);
        }
      })
      .catch(() => {
        if (mounted.current)
          setStorageError(
            "記録を読み込めませんでした。ステージ1から遊べます。",
          );
      })
      .finally(() => {
        if (mounted.current) setLoaded(true);
      });
    return () => {
      mounted.current = false;
    };
  }, []);
  const publish = useCallback(() => {
    if (!mounted.current) return;
    const s = engine.state;
    setHud(snapshot(engine));
    audio.setMusic(
      "008",
      !started ? "home" : s.feverLeft > 0 ? "008fever" : "008",
    );
    audio.setPaused(
      "008",
      started && ["paused", "stage_clear", "game_over"].includes(s.phase),
    );
    if (
      started &&
      saved.current !== engine &&
      ["stage_clear", "game_over"].includes(s.phase)
    ) {
      saved.current = engine;
      persist((previous) => {
        if (s.mode === "endless")
          return {
            ...previous,
            endlessBest: Math.max(previous.endlessBest, s.score),
            endlessWave: Math.max(previous.endlessWave, s.stage.id),
          };
        const old = previous.stages[s.stage.id];
        return mergeRecords(previous, {
          ...previous,
          stages: {
            [s.stage.id]: {
              score: Math.max(old?.score ?? 0, s.score),
              stars: s.phase === "stage_clear" ? s.stars : (old?.stars ?? 0),
            },
          },
        });
      });
    }
  }, [engine, started, persist]);
  const pause = useCallback(() => {
    engine.pause();
    publish();
  }, [engine, publish]);
  const resume = () => {
    if (AppState.currentState === "active") {
      engine.resume();
      publish();
    }
  };
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      director.reset();
      audio.setScene("008", started ? "008" : "home");
      publish();
      let handle = 0,
        last = 0,
        paint = 0;
      const loop = (now: number) => {
        if (
          started &&
          AppState.currentState === "active" &&
          !["paused", "stage_clear", "game_over"].includes(engine.state.phase)
        ) {
          if (last) engine.advance(now - last);
          frame.set(pack(engine));
          const events = engine.drainEvents();
          audio.setMusic(
            "008",
            engine.state.feverLeft > 0 ? "008fever" : "008",
          );
          for (const sound of director.consume(
            events,
            engine.state.combo,
            engine.state.time,
            engine.state.mode === "stages" && engine.state.stage.id === 10,
          ))
            audio.play(
              sound,
              [
                "cascadeClear",
                "cascadeWin",
                "cascadeOver",
                "cascadeFever",
              ].includes(sound)
                ? 3
                : sound === "cascadeHit1"
                  ? 1
                  : 2,
            );
          if (
            now - paint >= 100 ||
            events.start ||
            events.clear ||
            events.over ||
            events.fever ||
            engine.state.phase === "paused"
          ) {
            paint = now;
            publish();
          }
        }
        last = now;
        handle = requestAnimationFrame(loop);
      };
      handle = requestAnimationFrame(loop);
      return () => {
        focused.current = false;
        cancelAnimationFrame(handle);
        engine.pause();
        audio.setPaused("008", true);
      };
    }, [engine, started, publish, director, frame]),
  );
  useEffect(() => {
    const change = AppState.addEventListener("change", (s) => {
      if (s !== "active") pause();
    });
    const blur =
      Platform.OS === "android"
        ? AppState.addEventListener("blur", pause)
        : null;
    return () => {
      change.remove();
      blur?.remove();
    };
  }, [pause]);
  const start = (
    id: number,
    mode: "stages" | "endless" = "stages",
    continuing = false,
  ) => {
    if (
      !loaded ||
      (mode === "stages" && (id < 1 || id > recordsRef.current.highest))
    )
      return;
    const next = new CascadeEngine(
      mode === "endless" ? endlessStage(id) : STAGES[id - 1],
      mode,
    );
    if (continuing) next.state.score = engine.state.score;
    director.reset();
    saved.current = null;
    setHud(snapshot(next));
    frame.set(pack(next));
    setEngine(next);
    setStarted(true);
    audio.setPaused("008", false);
    audio.play("start");
  };
  const aim = useCallback(
    (angle: number) => {
      if (focused.current && engine.aim(angle)) publish();
    },
    [engine, publish],
  );
  const launch = useCallback(() => {
    if (focused.current && engine.launch()) publish();
  }, [engine, publish]);
  const cancelAim = useCallback(() => {
    engine.cancelAim();
    publish();
  }, [engine, publish]);
  return {
    hud,
    frame,
    records,
    loaded,
    storageError,
    started,
    start,
    pause,
    resume,
    aim,
    launch,
    cancelAim,

    select: () => {
      engine.pause();
      setStarted(false);
    },
    next: () => start(hud.stage.id + 1, hud.mode, hud.mode === "endless"),
    restart: () => start(hud.mode === "endless" ? 1 : hud.stage.id, hud.mode),
    reducedEffects: (value: boolean) =>
      persist((previous) => ({ ...previous, reducedEffects: value })),
  };
}
