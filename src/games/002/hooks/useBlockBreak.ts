import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { BlockBreakEngine } from "../logic/engine";
import { recordStore } from "../storage";
import { useDeveloperMode } from "@/developer/DeveloperMode";

export function useBlockBreak() {
  const { enabled: developerMode } = useDeveloperMode();
  const [engine] = useState(() => new BlockBreakEngine());
  const [state, setState] = useState(() => engine.snapshot());
  const [best, setBest] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const bestRef = useRef(0),
    mounted = useRef(true),
    focused = useRef(false);
  const lastHaptic = useRef(0),
    lastSave = useRef(0),
    dirty = useRef(false);
  const save = useCallback(() => {
    const s = engine.state;
    if (s.practice) {
      dirty.current = false;
      return;
    }
    bestRef.current = Math.max(bestRef.current, s.score);
    dirty.current = false;
    lastSave.current = Date.now();
    void recordStore
      .save({ best: bestRef.current, highest: s.highest, cleared: s.cleared })
      .then((r) => {
        bestRef.current = Math.max(bestRef.current, r.best);
        if (mounted.current) {
          setBest(bestRef.current);
          setStorageError(false);
        }
      })
      .catch(() => {
        dirty.current = true;
        if (mounted.current) setStorageError(true);
      });
  }, [engine]);
  const publish = useCallback(() => {
    if (!mounted.current) return;
    setState(engine.snapshot());
    if (!engine.state.practice)
      bestRef.current = Math.max(bestRef.current, engine.state.score);
    setBest(bestRef.current);
    const events = engine.drainEvents();
    if (events.includes("break")) dirty.current = true;
    if (
      events.some((e) => ["clear", "over", "miss"].includes(e)) ||
      (dirty.current && Date.now() - lastSave.current >= 2000)
    )
      save();
    const major = events.some((e) =>
      ["clear", "over", "fever", "item", "combo"].includes(e),
    );
    if (events.length && Date.now() - lastHaptic.current >= (major ? 60 : 90)) {
      lastHaptic.current = Date.now();
      const effect =
        Platform.OS === "android"
          ? Haptics.performAndroidHapticsAsync(
              major
                ? Haptics.AndroidHaptics.Confirm
                : Haptics.AndroidHaptics.Clock_Tick,
            )
          : Haptics.impactAsync(
              events.includes("clear") || events.includes("over")
                ? Haptics.ImpactFeedbackStyle.Heavy
                : major
                  ? Haptics.ImpactFeedbackStyle.Medium
                  : Haptics.ImpactFeedbackStyle.Soft,
            );
      void effect.catch(() => {});
    }
  }, [engine, save]);
  const pause = useCallback(() => {
    engine.pause();
    save();
    publish();
  }, [engine, save, publish]);
  useEffect(() => {
    mounted.current = true;
    void recordStore
      .load()
      .then((r) => {
        if (!mounted.current) return;
        bestRef.current = r.best;
        setBest(r.best);
        engine.restore(r.highest, r.cleared);
        setState(engine.snapshot());
      })
      .catch(() => {
        if (mounted.current) setStorageError(true);
      })
      .finally(() => {
        if (mounted.current) setLoaded(true);
      });
    return () => {
      mounted.current = false;
      engine.pause();
      save();
    };
  }, [engine, save]);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      let frame = 0,
        last: number | null = null;
      const loop = (time: number) => {
        if (
          last !== null &&
          AppState.currentState === "active" &&
          ["playing", "ready"].includes(engine.state.phase)
        ) {
          engine.advance(time - last);
          publish();
        }
        last = time;
        frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);
      const sub = AppState.addEventListener("change", (next) => {
        last = null;
        if (next !== "active") pause();
      });
      const blur = AppState.addEventListener("blur", pause);
      return () => {
        focused.current = false;
        cancelAnimationFrame(frame);
        sub.remove();
        blur.remove();
        pause();
      };
    }, [engine, pause, publish]),
  );
  const run = useCallback(
    (action: () => void) => {
      if (focused.current && AppState.currentState === "active") {
        action();
        publish();
      }
    },
    [publish],
  );
  const launch = useCallback(() => run(() => engine.launch()), [run, engine]);
  const move = useCallback(
    (x: number) => {
      if (focused.current && AppState.currentState === "active")
        engine.movePaddle(x);
    },
    [engine],
  );
  const resize = useCallback(
    (height: number) => {
      engine.resize(height);
      setState(engine.snapshot());
    },
    [engine],
  );
  const cancel = useCallback(() => engine.cancelInput(), [engine]);
  const getPaddle = useCallback(() => engine.state.paddle, [engine]);
  return {
    developerMode,
    state,
    engine,
    best,
    loaded,
    storageError,
    pause,
    launch,
    move,
    cancel,
    getPaddle,
    resize,
    start: (stage: number) => {
      if (loaded) {
        save();
        run(() => engine.start(stage, developerMode));
      }
    },
    resume: () => run(() => engine.resume()),
    restart: () => {
      save();
      run(() => engine.restartStage());
    },
    next: () => run(() => engine.nextStage()),
    select: () => {
      save();
      run(() => engine.select());
    },
  };
}
