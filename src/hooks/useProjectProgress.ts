import { useCallback, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { BRAND } from "@/data/brand";
import { games } from "@/data/catalog";
import {
  calendarDate,
  deadlineProgress,
  projectProgress,
} from "@/utils/project";

export function useProjectProgress() {
  const [today, setToday] = useState(() =>
    calendarDate(new Date(), BRAND.timeZone),
  );
  useFocusEffect(
    useCallback(() => {
      const update = () => setToday(calendarDate(new Date(), BRAND.timeZone));
      update();
      // Refresh across midnight while visible and immediately on foreground return.
      let timer: ReturnType<typeof setInterval> | undefined;
      const watch = (active: boolean) => {
        clearInterval(timer);
        if (active) {
          update();
          timer = setInterval(update, 60_000);
        }
      };
      watch(AppState.currentState === "active");
      const subscription = AppState.addEventListener("change", (state) =>
        watch(state === "active"),
      );
      return () => {
        clearInterval(timer);
        subscription.remove();
      };
    }, []),
  );
  return {
    ...projectProgress(games, BRAND.targetGames),
    ...deadlineProgress(today, BRAND.deadline),
  };
}
