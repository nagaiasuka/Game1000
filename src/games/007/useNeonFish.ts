import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { audio } from "@/audio/native";
import { blockSounds, catchSound } from "./audio";
import {
  createMatch,
  reducer,
  stepDelay,
  type Action,
  type Match,
  type PlayerCount,
} from "./logic/engine";

export function useNeonFish(blocked: boolean) {
  const [match, setMatch] = useState<Match | null>(null);
  const serial = useRef(0);
  const active = useRef(false);
  const locked = useRef(blocked);
  useEffect(() => {
    locked.current = blocked;
  }, [blocked]);
  const start = useCallback((players: PlayerCount, first: number) => {
    const next = createMatch(players, first);
    next.event.id = ++serial.current;
    setMatch(next);
  }, []);
  const dispatch = useCallback((action: Action) => {
    if (locked.current || !active.current) return;
    setMatch((prev) => (prev ? reducer(prev, action) : prev));
  }, []);
  useFocusEffect(
    useCallback(() => {
      active.current = true;
      audio.setScene("007", "home");
      return () => {
        active.current = false;
        audio.setPaused("007", true);
        audio.setMusicLevel("007", 1);
      };
    }, []),
  );
  const playing = !!match;
  const phase = match?.phase;
  useEffect(() => {
    audio.setMusic("007", playing ? "007" : "home");
    audio.setPaused("007", blocked);
    audio.setMusicLevel(
      "007",
      phase === "finished"
        ? 0
        : phase === "lifting" || phase === "stretching"
          ? 0.35
          : 1,
    );
  }, [playing, phase, blocked]);
  // A single resumable timeout. Pausing retains the time until the next block.
  const pending = useRef({ key: "", remaining: 0 });
  useEffect(() => {
    if (!match || !["casting", "lifting", "stretching"].includes(match.phase)) {
      pending.current.key = "";
      return;
    }
    const key = `${match.event.id}:${match.phase}:${match.revealed}`;
    if (pending.current.key !== key)
      pending.current = { key, remaining: stepDelay(match) };
    if (blocked) return;
    const began = Date.now();
    const timer = setTimeout(
      () => dispatch({ type: "advance" }),
      pending.current.remaining,
    );
    return () => {
      clearTimeout(timer);
      pending.current.remaining = Math.max(
        0,
        pending.current.remaining - (Date.now() - began),
      );
    };
  }, [match, blocked, dispatch]);
  const lastEvent = useRef<Match["event"] | null>(null);
  useEffect(() => {
    if (
      !match ||
      blocked ||
      !active.current ||
      lastEvent.current === match.event
    )
      return;
    lastEvent.current = match.event;
    const kind = match.event.kind;
    if (kind === "start") audio.play("start");
    if (kind === "select") audio.play("fishSelect");
    if (kind === "hook") {
      audio.play("fishHook");
      void Haptics.selectionAsync().catch(() => {});
    }
    if (kind === "lift") audio.play("fishLift");
    if (kind === "block") audio.play(blockSounds[match.revealed - 1]);
    if (kind === "catch") {
      audio.play(catchSound(match.revealed), 2);
      if (match.overtake) audio.play("fishOvertake", 2);
      void Haptics.impactAsync(
        match.revealed >= 7
          ? Haptics.ImpactFeedbackStyle.Heavy
          : Haptics.ImpactFeedbackStyle.Light,
      ).catch(() => {});
    }
    if (kind === "win") audio.play("fishWin", 3);
  }, [match, blocked]);
  return { match, start, dispatch };
}
