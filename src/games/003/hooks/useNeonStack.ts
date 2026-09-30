import { audio } from "@/audio/native";
import { stackSound } from "../audio";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { AppState, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { initialSession, sessionReducer } from "../logic/session";
import { chooseFirst } from "../logic/engine";

export function useNeonStack() {
  const [state, dispatch] = useReducer(
    sessionReducer,
    undefined,
    initialSession,
  );
  const lastHaptic = useRef(0);
  const phase = state.match?.phase;
  useFocusEffect(
    useCallback(() => {
      audio.setScene("003", phase ? "003" : "home");
      audio.setPaused("003", !!phase && phase !== "playing");
      return () => audio.setPaused("003", true);
    }, [phase]),
  );
  useEffect(() => {
    audio.setPaused("003", !!state.match && state.match.phase !== "playing");
  }, [state.match]);
  useEffect(() => {
    if (!state.event || AppState.currentState !== "active") return;
    audio.play(
      stackSound(state.event.kind, state.event.size),
      state.event.kind === "win" ? 3 : 1,
    );
    if (Date.now() - lastHaptic.current < 90) return;
    lastHaptic.current = Date.now();
    const kind = state.event.kind;
    const effect =
      Platform.OS === "android"
        ? Haptics.performAndroidHapticsAsync(
            kind === "warning"
              ? Haptics.AndroidHaptics.Reject
              : kind === "win"
                ? Haptics.AndroidHaptics.Confirm
                : kind === "cover"
                  ? Haptics.AndroidHaptics.Context_Click
                  : Haptics.AndroidHaptics.Clock_Tick,
          )
        : kind === "win" || kind === "warning"
          ? Haptics.notificationAsync(
              kind === "win"
                ? Haptics.NotificationFeedbackType.Success
                : Haptics.NotificationFeedbackType.Warning,
            )
          : Haptics.impactAsync(
              kind === "cover"
                ? Haptics.ImpactFeedbackStyle.Medium
                : Haptics.ImpactFeedbackStyle.Light,
            );
    void effect.catch(() => {});
  }, [state.event]);
  return {
    state,
    dispatch,
    start: () => dispatch({ type: "start", first: chooseFirst() }),
  };
}
