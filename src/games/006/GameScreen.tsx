import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  AppState,
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
import { NeonPushArtwork } from "@/components/game-artwork";
import { UI_TEXT } from "@/data/ui-text";
import { useColors } from "@/theme/ThemeProvider";
import { Board, VictoryWave } from "./components/Board";
import {
  DIRECTIONS,
  key,
  legalMoves,
  PLAYER_COLOR,
  TARGET,
} from "./logic/engine";
import type { Hex, Player } from "./logic/engine";
import { useNeonPush } from "./useNeonPush";
const ARROWS = ["→", "↗", "↖", "←", "↙", "↘"];
function PlayerStatus({
  player,
  name,
  turn,
  score,
  winner,
}: {
  player: Player;
  name: string;
  turn: Player;
  score: number;
  winner: Player | null;
}) {
  const c = useColors(),
    active = !winner && turn === player,
    color = PLAYER_COLOR[player];
  return (
    <View
      style={{
        marginHorizontal: 12,
        padding: 8,
        borderWidth: 1,
        borderRadius: 12,
        borderColor: active ? color : c.border,
        backgroundColor: active ? color + "18" : c.surface,
        transform: player === 2 ? [{ rotate: "180deg" }] : [],
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        maxFontSizeMultiplier={1.2}
        style={{ flex: 1, color, fontSize: 14, fontWeight: "800" }}
      >
        {name} · {player === 1 ? "シアン" : "ピンク"}
        {active ? " の番" : ""}
      </Text>
      <Text
        maxFontSizeMultiplier={1.2}
        style={{ color, fontSize: 16, fontWeight: "900" }}
      >
        落とした駒 {score} / {TARGET}
      </Text>
    </View>
  );
}
export default function GameScreen() {
  const c = useColors();
  const [names, setNames] = useState({ 1: "", 2: "" });
  const playerName = (player: Player) =>
    names[player].trim() || `プレイヤー${player}`;
  const [help, setHelp] = useState(false),
    [paused, setPaused] = useState(false),
    [confirming, setConfirming] = useState(false),
    [finishedEvent, setFinishedEvent] = useState(0),
    [size, setSize] = useState(0);
  const { state, dispatch } = useNeonPush(help || paused || confirming);
  const match = state.match,
    revision = state.revision;
  const start = () => {
    Keyboard.dismiss();
    setPaused(false);
    dispatch({ type: "start" });
  };
  const goHome = useCallback(() => {
    if (!match || match.winner) {
      router.dismissTo("/games");
      return;
    }
    setConfirming(true);
    Alert.alert(
      "ゲーム一覧へ戻りますか？",
      "現在の対戦は終了します。",
      [
        {
          text: UI_TEXT.cancel,
          style: "cancel",
          onPress: () => setConfirming(false),
        },
        {
          text: "ゲーム一覧へ",
          onPress: () => {
            setConfirming(false);
            router.dismissTo("/games");
          },
        },
      ],
      { cancelable: true, onDismiss: () => setConfirming(false) },
    );
  }, [match]);
  useFocusEffect(
    useCallback(() => {
      const back = BackHandler.addEventListener("hardwareBackPress", () => {
        goHome();
        return true;
      });
      return () => back.remove();
    }, [goHome]),
  );
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next !== "active") setPaused(true);
    });
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (!state.event?.move) return;
    const eventId = state.event.id;
    const timer = setTimeout(
      () => setFinishedEvent(eventId),
      state.event.move.out ? 430 : 200,
    );
    return () => clearTimeout(timer);
  }, [state.event]);
  const moves = match ? legalMoves(match, state.selection) : [];
  const disabled =
    help ||
    paused ||
    confirming ||
    (!!state.event?.move && state.event.id !== finishedEvent) ||
    !!match?.winner;
  const onCell = (cell: Hex) => {
    if (disabled || !match) return;
    const move = moves.find((m) => key(m.target) === key(cell));
    if (move) dispatch({ type: "move", direction: move.direction, revision });
    else dispatch({ type: "select", cell, revision });
  };
  const restart = () => {
    setConfirming(true);
    Alert.alert(
      "最初からやり直しますか？",
      "盤面と両プレイヤーの得点は0に戻ります。",
      [
        {
          text: UI_TEXT.cancel,
          style: "cancel",
          onPress: () => setConfirming(false),
        },
        {
          text: "やり直す",
          onPress: () => {
            setConfirming(false);
            start();
          },
        },
      ],
      { cancelable: true, onDismiss: () => setConfirming(false) },
    );
  };
  const message =
    state.event?.kind === "blocked"
      ? "押せない！ 一直線に最大3個、相手より多く。"
      : state.event?.move?.out
        ? "盤外へ押し出した！ +1"
        : state.selection.length
          ? `${state.selection.length}個選択中 · 光るマスか矢印をタップ`
          : "自分の駒を選ぼう · 一直線に最大3個";
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <HowToPlayModal
        gameId="006"
        visible={help}
        onClose={() => setHelp(false)}
      />
      <View
        style={{
          paddingHorizontal: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={goHome}
          style={{ minWidth: 44, minHeight: 48, justifyContent: "center" }}
        >
          <Text maxFontSizeMultiplier={1.2} style={{ color: c.cyan }}>
            ‹ 一覧
          </Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            maxFontSizeMultiplier={1.1}
            style={{ color: c.muted, fontSize: 11 }}
          >
            GAME #006
          </Text>
          <Text
            maxFontSizeMultiplier={1.1}
            style={{ color: c.text, fontSize: 18, fontWeight: "900" }}
          >
            NEON PUSH
          </Text>
        </View>
        <HelpButton onPress={() => setHelp(true)} />
      </View>
      {!match ? (
        <ScrollView
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 22,
            gap: 20,
            width: "100%",
            maxWidth: 600,
            alignSelf: "center",
          }}
        >
          <NeonPushArtwork />
          <Text
            style={{
              color: c.text,
              fontSize: 26,
              fontWeight: "900",
              textAlign: "center",
            }}
          >
            押して、落とせ。
          </Text>
          <Text style={{ color: c.cyan, fontSize: 16, textAlign: "center" }}>
            2人対戦 · 約3〜5分
          </Text>
          <Text style={{ color: c.text, fontSize: 15, textAlign: "center" }}>
            下：プレイヤー1 シアン / 上：プレイヤー2 ピンク
          </Text>
          <GameInstructions gameId="006" compact />
          <PlayerNameInputs
            players={[
              { id: 1, color: PLAYER_COLOR[1], detail: "下 · シアン" },
              { id: 2, color: PLAYER_COLOR[2], detail: "上 · ピンク" },
            ]}
            names={names}
            onChange={(player, value) =>
              setNames((old) => ({ ...old, [player]: value }))
            }
          />
          <GameButton title="ゲームスタート" onPress={start} />
          <GameButton
            secondary
            title={UI_TEXT.howToPlay}
            onPress={() => setHelp(true)}
          />
        </ScrollView>
      ) : (
        <View style={{ flex: 1, gap: 4 }}>
          <PlayerStatus
            player={2}
            name={playerName(2)}
            turn={match.turn}
            score={match.scores[2]}
            winner={match.winner}
          />
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
            onLayout={({ nativeEvent: { layout } }) =>
              setSize(
                Math.floor(
                  Math.max(0, Math.min(layout.width - 12, layout.height)),
                ),
              )
            }
          >
            {size > 0 && (
              <Board
                match={match}
                selection={state.selection}
                moves={moves}
                size={size}
                onCell={onCell}
                move={state.event?.move}
                eventId={state.event?.id ?? 0}
                disabled={disabled}
              />
            )}
            {match.winner && (
              <Modal
                transparent
                visible={finishedEvent === state.event?.id}
                animationType="fade"
                onRequestClose={goHome}
              >
                <SafeAreaView
                  style={{ flex: 1, backgroundColor: c.background + "EE" }}
                >
                  <ScrollView
                    contentContainerStyle={{
                      flexGrow: 1,
                      justifyContent: "center",
                      padding: 24,
                    }}
                  >
                    <View
                      style={{
                        position: "relative",
                        backgroundColor: c.background + "D9",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 20,
                        gap: 12,
                        borderColor: PLAYER_COLOR[match.winner],
                        borderWidth: 2,
                      }}
                    >
                      <VictoryWave color={PLAYER_COLOR[match.winner]} />
                      <Text
                        maxFontSizeMultiplier={1.2}
                        style={{
                          color: PLAYER_COLOR[match.winner],
                          fontSize: 23,
                          fontWeight: "900",
                          transform: [{ rotate: "180deg" }],
                        }}
                      >
                        {playerName(match.winner)}の勝ち！
                      </Text>
                      <Text
                        style={{
                          color: PLAYER_COLOR[match.winner],
                          fontSize: 30,
                          fontWeight: "900",
                        }}
                      >
                        WIN!
                      </Text>
                      <Text
                        style={{
                          color: c.text,
                          fontSize: 22,
                          fontWeight: "900",
                        }}
                      >
                        {playerName(match.winner)}の勝ち！
                      </Text>
                      <Text style={{ color: c.text, fontSize: 16 }}>
                        5個、盤外へ押し出した！
                      </Text>
                      <GameButton title={UI_TEXT.retry} onPress={start} />
                      <GameButton
                        secondary
                        title="ゲーム一覧へ"
                        onPress={goHome}
                      />
                    </View>
                  </ScrollView>
                </SafeAreaView>
              </Modal>
            )}
          </View>
          <Text
            accessibilityLiveRegion="polite"
            numberOfLines={2}
            maxFontSizeMultiplier={1.15}
            style={{
              height: 38,
              paddingHorizontal: 10,
              textAlign: "center",
              fontSize: 13,
              color: state.event?.kind === "blocked" ? c.yellow : c.text,
            }}
          >
            {message}
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 4,
              transform: match.turn === 2 ? [{ rotate: "180deg" }] : [],
            }}
          >
            {DIRECTIONS.map((direction, i) => {
              const legal = moves.some(
                (m) => key(m.direction) === key(direction),
              );
              // Rotating the panel also rotates its arrows; reverse directions for player 2.
              const d = match.turn === 2 ? DIRECTIONS[(i + 3) % 6] : direction;
              const enabled =
                match.turn === 2
                  ? moves.some((m) => key(m.direction) === key(d))
                  : legal;
              return (
                <Pressable
                  key={i}
                  accessibilityRole="button"
                  accessibilityLabel={`${ARROWS[i]}の方向へ移動`}
                  disabled={disabled || !state.selection.length}
                  onPress={() =>
                    dispatch({ type: "move", direction: d, revision })
                  }
                  style={{
                    minWidth: 44,
                    minHeight: 44,
                    borderRadius: 9,
                    borderWidth: 1,
                    borderColor: enabled ? PLAYER_COLOR[match.turn] : c.border,
                    backgroundColor: enabled
                      ? PLAYER_COLOR[match.turn] + "18"
                      : c.surface,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontSize: 22,
                      color: enabled ? PLAYER_COLOR[match.turn] : c.muted,
                    }}
                  >
                    {ARROWS[i]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <PlayerStatus
            player={1}
            name={playerName(1)}
            turn={match.turn}
            score={match.scores[1]}
            winner={match.winner}
          />
          <View
            style={{ flexDirection: "row", gap: 12, paddingHorizontal: 12 }}
          >
            <Pressable
              accessibilityRole="button"
              disabled={!!match.winner}
              onPress={restart}
              style={{ minHeight: 44, justifyContent: "center", flex: 1 }}
            >
              <Text
                maxFontSizeMultiplier={1.2}
                style={{ color: c.cyan, textAlign: "center" }}
              >
                {UI_TEXT.restart}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setPaused(true)}
              style={{ minHeight: 44, justifyContent: "center", flex: 1 }}
            >
              <Text
                maxFontSizeMultiplier={1.2}
                style={{ color: c.cyan, textAlign: "center" }}
              >
                {UI_TEXT.paused}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
      {paused && match && !help && (
        <View
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: c.background + "EE",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            gap: 20,
          }}
        >
          <Text style={{ color: c.text, fontSize: 24 }}>{UI_TEXT.paused}</Text>
          <GameButton title={UI_TEXT.resume} onPress={() => setPaused(false)} />
        </View>
      )}
    </SafeAreaView>
  );
}
