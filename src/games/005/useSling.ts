import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { audio } from "@/audio/native";
import { SlingEngine } from "./logic/engine";
import { slingSounds } from "./audio";
export function useSling() {
  const [engine] = useState(() => new SlingEngine());
  const [state, setState] = useState(() => engine.snapshot());
  const lastHaptic = useRef(0);
  const publish = useCallback(() => {
    setState(engine.snapshot());
    audio.setMusic("005", engine.state.phase === "ready" ? "home" : "005");
    audio.setPaused(
      "005",
      engine.state.phase === "paused" || engine.state.phase === "won",
    );
    const events = engine.drainEvents();
    for (const sound of slingSounds(events))
      audio.play(
        sound,
        sound === "slingWin" ? 3 : sound === "slingGate" ? 2 : 1,
      );
    if (events.includes("win")) {
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
    } else if (
      events.some((e) => e === "gate" || e === "shot") &&
      Date.now() - lastHaptic.current > 100
    ) {
      lastHaptic.current = Date.now();
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => {},
      );
    }
  }, [engine]);
  const pause = useCallback(() => {
    engine.pause();
    publish();
  }, [engine, publish]);
  const resume = useCallback(() => {
    if (AppState.currentState === "active") {
      engine.resume();
      publish();
    }
  }, [engine, publish]);
  useFocusEffect(
    useCallback(() => {
      audio.setScene("005", engine.state.phase === "ready" ? "home" : "005");
      publish();
      let frame = 0,
        last = 0,
        paint = 0;
      const loop = (now: number) => {
        const active =
          engine.state.phase === "playing" ||
          engine.state.phase === "countdown";
        if (last && AppState.currentState === "active")
          engine.advance((now - last) / 1000);
        last = now;
        if (active && (now - paint >= 16 || engine.state.phase === "won")) {
          paint = now;
          publish();
        }
        frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);
      return () => {
        cancelAnimationFrame(frame);
        engine.pause();
        audio.setPaused("005", true);
      };
    }, [engine, publish]),
  );
  useEffect(() => {
    const change = AppState.addEventListener("change", (s) => {
      if (s !== "active") pause();
    });
    const blur = AppState.addEventListener("blur", pause);
    return () => {
      change.remove();
      blur.remove();
    };
  }, [pause]);
  return {
    engine,
    state,
    publish,
    pause,
    resume,
    start: () => {
      engine.start();
      publish();
    },
  };
}
