import { useCallback, useEffect, useReducer } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { audio } from "@/audio/native";
import { initialSession, sessionReducer } from "./logic/session";
import { pushSound } from "./audio";
export function useNeonPush(blocked: boolean) {
  const [state, dispatch] = useReducer(
    sessionReducer,
    undefined,
    initialSession,
  );
  const playing = !!state.match;
  useFocusEffect(
    useCallback(() => {
      audio.setScene("006", playing ? "006" : "home");
      audio.setPaused("006", blocked);
      return () => audio.setPaused("006", true);
    }, [playing, blocked]),
  );
  useEffect(() => {
    if (!state.event || AppState.currentState !== "active") return;
    if (state.event.kind === "win" && state.event.move?.out)
      audio.play("pushOut", 2);
    audio.play(pushSound(state.event.kind), state.event.kind === "win" ? 3 : 1);
    if (state.event.kind === "blocked")
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning,
      ).catch(() => {});
    else if (state.event.move?.out)
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(
        () => {},
      );
    else void Haptics.selectionAsync().catch(() => {});
    if (state.event.move && state.event.kind !== "win") {
      const timer = setTimeout(() => audio.play("pushTurn", 0), 230);
      return () => clearTimeout(timer);
    }
  }, [state.event]);
  return { state, dispatch };
}
