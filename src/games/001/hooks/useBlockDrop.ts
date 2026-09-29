import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { BlockDropEngine, type Action, type HeldAction } from "../logic/engine";
import { bestStore } from "../storage";

export function useBlockDrop() {
  const [engine] = useState(() => new BlockDropEngine());
  const [state, setState] = useState(() => engine.snapshot());
  const [best, setBest] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const bestRef = useRef(0);
  const [runBest, setRunBest] = useState(0);
  const mounted = useRef(true);
  const revision = useRef(-1);
  const focused = useRef(false);
  const save = useCallback(() => {
    const score = Math.max(bestRef.current, engine.state.score);
    void bestStore
      .save(score)
      .then((value) => {
        bestRef.current = Math.max(bestRef.current, value);
        if (mounted.current) {
          setBest(bestRef.current);
          setStorageError(false);
        }
      })
      .catch(() => {
        if (mounted.current) setStorageError(true);
      });
  }, [engine]);
  const publish = useCallback(() => {
    if (!mounted.current) return;
    if (revision.current !== engine.revision) {
      revision.current = engine.revision;
      bestRef.current = Math.max(bestRef.current, engine.state.score);
      setBest(bestRef.current);
      setState(engine.snapshot());
    }
    const events = engine.drainEvents();
    if (
      events.includes("scored") ||
      events.includes("lock") ||
      events.includes("over") ||
      events.includes("level")
    )
      save();
    if (
      events.some((e) => ["drop", "clear", "four", "level", "over"].includes(e))
    ) {
      const major = events.some((e) => ["four", "level", "over"].includes(e));
      const feedback =
        Platform.OS === "android"
          ? Haptics.performAndroidHapticsAsync(
              major
                ? Haptics.AndroidHaptics.Confirm
                : Haptics.AndroidHaptics.Clock_Tick,
            )
          : Haptics.impactAsync(
              major
                ? Haptics.ImpactFeedbackStyle.Medium
                : Haptics.ImpactFeedbackStyle.Light,
            );
      void feedback.catch(() => {});
    }
  }, [engine, save]);
  const pause = useCallback(() => {
    engine.pause();
    save();
    publish();
  }, [engine, publish, save]);
  useEffect(() => {
    mounted.current = true;
    void bestStore
      .load()
      .then((value) => {
        bestRef.current = Math.max(bestRef.current, value);
        if (mounted.current) setBest(bestRef.current);
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
      let frame = 0;
      let last: number | null = null;
      const loop = (time: number) => {
        if (last !== null && AppState.currentState === "active")
          engine.advance(time - last);
        last = time;
        publish();
        frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);
      const subscription = AppState.addEventListener("change", (next) => {
        last = null;
        if (next !== "active") pause();
      });
      // Android notification shade may emit blur without changing AppState.
      const blur = AppState.addEventListener("blur", pause);
      return () => {
        focused.current = false;
        cancelAnimationFrame(frame);
        subscription.remove();
        blur.remove();
        pause();
      };
    }, [engine, pause, publish]),
  );
  const touchStart = useCallback(
    (size: number) => {
      if (focused.current && AppState.currentState === "active")
        engine.touchStart(size);
    },
    [engine],
  );
  const touchMove = useCallback(
    (dx: number, dy: number, touches: number) => {
      if (focused.current && AppState.currentState === "active") {
        engine.touchMove(dx, dy, touches);
        publish();
      }
    },
    [engine, publish],
  );
  const touchEnd = useCallback(() => {
    if (focused.current && AppState.currentState === "active") {
      engine.touchEnd();
      publish();
    } else engine.touchCancel();
  }, [engine, publish]);
  const touchCancel = useCallback(() => {
    engine.touchCancel();
    publish();
  }, [engine, publish]);
  const canInput = () => focused.current && AppState.currentState === "active";
  return {
    state,
    touchStart,
    touchMove,
    touchEnd,
    touchCancel,
    best,
    loaded,
    storageError,
    newBest: state.score > runBest && state.score > 0,
    start: () => {
      if (!loaded || !canInput()) return;
      save();
      setRunBest(bestRef.current);
      engine.start();
      publish();
    },
    pause,
    resume: () => {
      if (canInput()) {
        engine.resume();
        publish();
      }
    },
    input: (action: Action) => {
      if (canInput()) {
        engine.input(action);
        publish();
      }
    },
    press: (action: HeldAction) => {
      if (canInput()) {
        engine.press(action);
        publish();
      }
    },
    release: (action: HeldAction) => engine.release(action),
  };
}
