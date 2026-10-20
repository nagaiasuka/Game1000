import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  Platform,
  BackHandler,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  GameButton,
  GameInstructions,
  HelpButton,
  HowToPlayModal,
} from "@/components/game/common";
import { PlayerNameInputs } from "@/components/game/PlayerNameInputs";
import { NeonFishArtwork } from "@/components/game-artwork";
import { UI_TEXT } from "@/data/ui-text";
import { useColors } from "@/theme/ThemeProvider";
import { PLAYER_COLORS, rankings, type PlayerCount } from "./logic/engine";
import { useNeonFish } from "./useNeonFish";
import { Pond } from "./components/Pond";

const ActionButton = ({ title, fn }: { title: string; fn: () => void }) => {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={fn}
      style={{
        minWidth: 44,
        minHeight: 44,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 8,
      }}
    >
      <Text
        maxFontSizeMultiplier={1.2}
        style={{ color: c.cyan, fontSize: 14, fontWeight: "700" }}
      >
        {title}
      </Text>
    </Pressable>
  );
};

export default function GameScreen() {
  const c = useColors();
  const [players, setPlayers] = useState<PlayerCount>(2);
  const [names, setNames] = useState<Record<number, string>>({});
  const [paused, setPaused] = useState(false),
    [help, setHelp] = useState(false);
  const [confirm, setConfirm] = useState<"restart" | "quit" | null>(null);
  const { match, start, dispatch } = useNeonFish(paused || help || !!confirm);
  const running = !!match && match.phase !== "finished";
  const runningRef = useRef(running);
  useEffect(() => {
    runningRef.current = running;
  }, [running]);
  const name = (player: number) =>
    names[player + 1]?.trim() || `P${player + 1}`;
  const quit = useCallback(() => {
    if (runningRef.current) {
      setPaused(true);
      setConfirm("quit");
    } else router.replace("/games");
  }, []);
  useFocusEffect(
    useCallback(() => {
      const back = BackHandler.addEventListener("hardwareBackPress", () => {
        quit();
        return true;
      });
      return () => {
        back.remove();
        if (runningRef.current) setPaused(true);
      };
    }, [quit]),
  );
  useEffect(() => {
    const stop = () => {
      if (runningRef.current) setPaused(true);
    };
    const state = AppState.addEventListener("change", (s) => {
      if (s !== "active") stop();
    });
    const blur =
      Platform.OS === "android"
        ? AppState.addEventListener("blur", stop)
        : null;
    return () => {
      state.remove();
      blur?.remove();
    };
  }, []);
  const begin = (rematch = false) => {
    Keyboard.dismiss();
    setPaused(false);
    setConfirm(null);
    start(
      players,
      rematch && match ? (match.first + 1) % players : (match?.first ?? 0),
    );
  };
  const ranks = match ? rankings(match.scores) : [];
  const displayScores =
    match?.scores.map(
      (score, i) =>
        score +
        (i === match.turn && ["lifting", "stretching"].includes(match.phase)
          ? match.revealed
          : 0),
    ) ?? [];
  const finished = match?.phase === "finished";
  const activeColor = PLAYER_COLORS[match?.turn ?? 0];
  const text = { color: c.text, fontSize: 15 } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 10,
        }}
      >
        {<ActionButton title="‹ 一覧" fn={quit} />}
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={1.1}
          style={{ flex: 1, color: c.muted, fontSize: 12, fontWeight: "800" }}
        >
          GAME #007
        </Text>
        {running && (
          <ActionButton title={UI_TEXT.paused} fn={() => setPaused(true)} />
        )}
        <HelpButton
          onPress={() => {
            if (running) setPaused(true);
            setHelp(true);
          }}
        />
      </View>
      {!match ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 20,
            gap: 20,
            maxWidth: 640,
            width: "100%",
            alignSelf: "center",
          }}
        >
          <NeonFishArtwork />
          <Text style={{ color: c.text, fontWeight: "900", fontSize: 28 }}>
            NEON FISH
          </Text>
          <Text style={text}>釣って、伸ばして、逆転しろ。</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {([2, 3, 4] as const).map((n) => (
              <Pressable
                key={n}
                accessibilityRole="button"
                accessibilityLabel={`${n}人対戦`}
                accessibilityState={{ selected: players === n }}
                onPress={() => setPlayers(n)}
                style={{
                  flex: 1,
                  padding: 14,
                  minHeight: 48,
                  borderRadius: 14,
                  borderWidth: 2,
                  borderColor: players === n ? c.cyan : c.border,
                  backgroundColor: c.surface,
                }}
              >
                <Text
                  style={{ ...text, textAlign: "center", fontWeight: "800" }}
                >
                  {players === n ? "✓ " : ""}
                  {n}人
                </Text>
              </Pressable>
            ))}
          </View>
          <PlayerNameInputs
            players={Array.from({ length: players }, (_, i) => ({
              id: i + 1,
              color: PLAYER_COLORS[i],
            }))}
            names={names}
            onChange={(id, value) =>
              setNames((prev) => ({ ...prev, [id]: value }))
            }
          />
          <GameButton
            title={`ゲーム${UI_TEXT.start}`}
            onPress={() => begin()}
          />
          <GameInstructions gameId="007" compact />
        </ScrollView>
      ) : finished ? (
        <ScrollView
          contentContainerStyle={{
            padding: 24,
            gap: 20,
            maxWidth: 640,
            width: "100%",
            alignSelf: "center",
          }}
        >
          <Text style={{ color: c.cyan, fontSize: 16, fontWeight: "800" }}>
            釣り大会 結果発表
          </Text>
          <Text
            accessibilityRole="header"
            style={{
              color: PLAYER_COLORS[ranks[0].player],
              fontSize: 28,
              fontWeight: "900",
            }}
          >
            {ranks
              .filter((p) => p.rank === 1)
              .map((p) => name(p.player))
              .join("・")}
            {ranks.filter((p) => p.rank === 1).length > 1
              ? " 同点優勝！"
              : " の勝ち！"}
          </Text>
          {ranks.map((p) => (
            <View
              key={p.player}
              style={{
                padding: 18,
                gap: 8,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: PLAYER_COLORS[p.player],
                backgroundColor: c.surface,
              }}
            >
              <Text
                style={{
                  ...text,
                  fontSize: 20,
                  fontWeight: "800",
                  color: PLAYER_COLORS[p.player],
                }}
              >
                {p.rank}位 · {name(p.player)}（{p.player + 1}）
              </Text>
              <Text style={text}>{p.score} ブロック</Text>
              <Text style={{ color: c.muted, fontSize: 14 }}>
                {match.catches[p.player].join(" + ")} = {p.score}
              </Text>
            </View>
          ))}
          <Text style={text}>
            次は {name((match.first + 1) % players)} から！
          </Text>
          <GameButton title={UI_TEXT.retry} onPress={() => begin(true)} />
          <GameButton
            title="ゲーム一覧へ"
            secondary
            onPress={() => router.replace("/games")}
          />
        </ScrollView>
      ) : (
        <View style={{ flex: 1, gap: 8, paddingBottom: 8 }}>
          <View style={{ paddingHorizontal: 16, gap: 4 }}>
            <Text
              accessibilityLiveRegion="polite"
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.2}
              style={{ color: activeColor, fontSize: 25, fontWeight: "900" }}
            >
              {name(match.turn)} の番！
            </Text>
            <Text
              maxFontSizeMultiplier={1.2}
              style={{ color: c.muted, fontSize: 13 }}
            >
              {Math.min(
                Math.floor(
                  (match.completed - (match.phase === "caught" ? 1 : 0)) /
                    match.players,
                ) + 1,
                match.fish.length / match.players,
              )}{" "}
              / {match.fish.length / match.players} 回目 · 残り{" "}
              {match.fish.length - match.completed} 匹
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 5, paddingHorizontal: 12 }}>
            {displayScores.map((score, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  padding: 7,
                  gap: 3,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: match.turn === i ? PLAYER_COLORS[i] : c.border,
                  backgroundColor:
                    match.turn === i ? PLAYER_COLORS[i] + "15" : c.surface,
                }}
              >
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  maxFontSizeMultiplier={1.15}
                  style={{
                    color: PLAYER_COLORS[i],
                    fontSize: 13,
                    fontWeight: "800",
                  }}
                >
                  {i + 1} · {name(i)}
                </Text>
                <Text
                  maxFontSizeMultiplier={1.15}
                  style={{ color: c.text, fontSize: 23, fontWeight: "900" }}
                >
                  {score}
                  <Text style={{ fontSize: 11 }}> 点</Text>
                </Text>
                <Text
                  maxFontSizeMultiplier={1.15}
                  style={{ color: c.muted, fontSize: 11 }}
                >
                  {1 + displayScores.filter((s) => s > score).length}位
                </Text>
              </View>
            ))}
          </View>
          <Pond
            match={match}
            paused={paused || help || !!confirm}
            onSelect={(id) => dispatch({ type: "select", id })}
            onLift={() => dispatch({ type: "lift" })}
          />
          <View
            style={{
              paddingHorizontal: 16,
              minHeight: 32,
              justifyContent: "center",
            }}
          >
            <Text
              maxFontSizeMultiplier={1.2}
              style={{ ...text, textAlign: "center", fontWeight: "700" }}
            >
              {match.phase === "choosing"
                ? "長さはひみつ！ 魚をタップ"
                : match.phase === "casting"
                  ? "釣り針をおろしています…"
                  : match.phase === "hooked"
                    ? "針がかかった！ 上へスワイプ ↑"
                    : match.phase === "caught"
                      ? `${name(match.turn)} に ${match.revealed} 点！`
                      : "まだ伸びる…？"}
            </Text>
          </View>
          <View style={{ paddingHorizontal: 12, minHeight: 48 }}>
            {match.phase === "caught" ? (
              <GameButton
                title={
                  match.completed === match.fish.length
                    ? "結果を見る"
                    : "次のプレイヤーへ"
                }
                onPress={() => dispatch({ type: "next" })}
              />
            ) : (
              <GameButton
                title={
                  match.phase === "hooked"
                    ? "↑ 釣り上げる（タップでもOK）"
                    : match.phase === "choosing"
                      ? "魚を選んでね"
                      : "釣り上げ中…"
                }
                disabled={match.phase !== "hooked"}
                onPress={() => dispatch({ type: "lift" })}
              />
            )}
          </View>
        </View>
      )}
      <HowToPlayModal
        gameId="007"
        visible={help}
        onClose={() => setHelp(false)}
      />
      <Modal
        visible={paused && !help}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#000000CC",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <ScrollView
            contentContainerStyle={{
              padding: 22,
              gap: 18,
              backgroundColor: c.surface,
              borderRadius: 20,
            }}
            style={{ flexGrow: 0, maxHeight: "90%" }}
          >
            <Text style={{ color: c.text, fontSize: 24, fontWeight: "800" }}>
              {confirm
                ? confirm === "quit"
                  ? "ゲーム一覧へ戻りますか？"
                  : "最初からやり直しますか？"
                : UI_TEXT.paused}
            </Text>
            {confirm ? (
              <>
                <Text style={text}>今回の得点は0に戻ります。</Text>
                <GameButton
                  title={confirm === "quit" ? "ゲーム一覧へ" : "やり直す"}
                  onPress={() => {
                    if (confirm === "quit") {
                      setConfirm(null);
                      router.replace("/games");
                    } else begin();
                  }}
                />
                <GameButton
                  secondary
                  title={UI_TEXT.cancel}
                  onPress={() => setConfirm(null)}
                />
              </>
            ) : (
              <>
                <GameButton
                  title={UI_TEXT.resume}
                  onPress={() => setPaused(false)}
                />
                <GameButton
                  title={UI_TEXT.howToPlay}
                  secondary
                  onPress={() => setHelp(true)}
                />
                <GameButton
                  title={UI_TEXT.restart}
                  secondary
                  onPress={() => setConfirm("restart")}
                />
                <GameButton
                  title="ゲーム一覧へ"
                  secondary
                  onPress={() => setConfirm("quit")}
                />
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
