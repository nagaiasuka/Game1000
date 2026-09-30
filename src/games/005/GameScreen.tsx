import { useCallback, useState } from "react";
import {
  Alert,
  BackHandler,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import {
  GameButton,
  GameInstructions,
  HowToPlayModal,
} from "@/components/game/common";
import { NeonSlingArtwork } from "@/components/game-artwork";
import { useColors } from "@/theme/ThemeProvider";
import { useSling } from "./useSling";
import { Field } from "./components/Field";
import { WIDTH } from "./logic/engine";
const COLORS = { 1: "#00F5FF", 2: "#FF2BD6" };
export default function GameScreen() {
  const c = useColors(),
    { engine, state, publish, pause, resume, start } = useSling();
  const [help, setHelp] = useState(false);
  const { width } = useWindowDimensions();
  const goHome = useCallback(() => {
    if (engine.state.phase === "ready" || engine.state.phase === "won") {
      router.dismissTo("/");
      return;
    }
    pause();
    Alert.alert(
      "ゲームをやめますか？",
      "現在の対戦と勝利数はリセットされます。",
      [
        { text: "ゲームを続ける", style: "cancel", onPress: resume },
        { text: "ホームへ戻る", onPress: () => router.dismissTo("/") },
      ],
      { cancelable: true, onDismiss: resume },
    );
  }, [engine, pause, resume]);
  useFocusEffect(
    useCallback(() => {
      const back = BackHandler.addEventListener("hardwareBackPress", () => {
        goHome();
        return true;
      });
      return () => back.remove();
    }, [goHome]),
  );
  const settings = () => {
    pause();
    setHelp(true);
  };
  const hudButton = (label: string, symbol: string, action: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={action}
      style={{
        width: "100%",
        minHeight: 48,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        allowFontScaling={false}
        style={{ color: c.cyan, fontSize: 22, fontWeight: "700" }}
      >
        {symbol}
      </Text>
    </Pressable>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <HowToPlayModal
        gameId="005"
        visible={help}
        onClose={() => {
          setHelp(false);
          resume();
        }}
      />
      {state.phase === "ready" ? (
        <ScrollView
          contentContainerStyle={{
            padding: 22,
            gap: 20,
            maxWidth: 600,
            width: "100%",
            alignSelf: "center",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.muted, fontSize: 12 }}>GAME #005</Text>
              <Text style={{ color: c.text, fontSize: 28, fontWeight: "900" }}>
                NEON SLING
              </Text>
            </View>
            <Pressable
              onPress={goHome}
              accessibilityRole="button"
              style={{ minWidth: 64, minHeight: 48, justifyContent: "center" }}
            >
              <Text style={{ color: c.cyan }}>ホームへ</Text>
            </Pressable>
          </View>
          <NeonSlingArtwork />
          <Text
            style={{
              color: c.text,
              fontSize: 23,
              fontWeight: "900",
              textAlign: "center",
            }}
          >
            引け。離せ。全部送り込め。
          </Text>
          <Text style={{ color: c.cyan, fontSize: 15, textAlign: "center" }}>
            スマホを机に置いて、上下から2人同時対戦！
          </Text>
          <GameInstructions gameId="005" compact />
          <GameButton title="2人でスタート" onPress={start} />
          <GameButton
            secondary
            title="遊び方・サウンド設定"
            onPress={settings}
          />
        </ScrollView>
      ) : (
        <View style={{ flex: 1, flexDirection: "row" }}>
          <View style={{ flex: 1 }}>
            <Field
              engine={engine}
              state={state}
              onLayout={(w, h) => {
                engine.resize((h / w) * WIDTH);
                publish();
              }}
              onInput={publish}
            />
            {state.phase === "paused" && !help && (
              <View
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "#070711B8",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 16,
                  gap: 16,
                }}
              >
                <Text
                  style={{ color: c.text, fontSize: 22, fontWeight: "800" }}
                >
                  一時停止
                </Text>
                <GameButton title="ゲームに戻る" onPress={resume} />
              </View>
            )}
            {state.winner && (
              <View
                style={{
                  position: "absolute",
                  inset: 0,
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 18,
                  gap: 16,
                }}
              >
                <View
                  style={{
                    padding: 16,
                    gap: 6,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: COLORS[state.winner],
                    backgroundColor: c.background + "EF",
                    width: "100%",
                  }}
                >
                  <Text
                    maxFontSizeMultiplier={1.2}
                    style={{
                      textAlign: "center",
                      color: COLORS[state.winner],
                      fontSize: 23,
                      fontWeight: "900",
                      transform: [{ rotate: "180deg" }],
                    }}
                  >
                    プレイヤー{state.winner}の勝ち！
                  </Text>
                  <Text
                    maxFontSizeMultiplier={1.2}
                    style={{
                      textAlign: "center",
                      color: COLORS[state.winner],
                      fontSize: 32,
                      fontWeight: "900",
                    }}
                  >
                    WIN!
                  </Text>
                  <Text
                    maxFontSizeMultiplier={1.2}
                    style={{
                      textAlign: "center",
                      color: c.text,
                      fontSize: 20,
                      fontWeight: "800",
                    }}
                  >
                    プレイヤー{state.winner}の勝ち！
                  </Text>
                  <Text
                    style={{
                      textAlign: "center",
                      color: c.muted,
                      fontSize: 13,
                    }}
                  >
                    1：{state.wins[1]}勝 ／ 2：{state.wins[2]}勝
                  </Text>
                </View>
                <GameButton title="もう一度" onPress={start} />
                <GameButton secondary title="ホームへ" onPress={goHome} />
              </View>
            )}
          </View>
          <View
            style={{
              width: Math.max(44, Math.min(60, width * 0.13)),
              borderLeftWidth: 1,
              borderColor: c.border,
              backgroundColor: c.surface,
              alignItems: "center",
            }}
          >
            {hudButton("ホームへ戻る", "‹", goHome)}
            {hudButton("遊び方・サウンド設定", "⚙", settings)}
            <View
              style={{
                flex: 1,
                justifyContent: "space-evenly",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  alignItems: "center",
                  transform: [{ rotate: "180deg" }],
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{ fontSize: 11, color: COLORS[2] }}
                >
                  2 残り
                </Text>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 30,
                    fontWeight: "900",
                    color: state.counts[2] === 1 ? "#FFE600" : COLORS[2],
                  }}
                >
                  {state.counts[2]}
                </Text>
              </View>
              <Text
                allowFontScaling={false}
                style={{ fontSize: 12, color: c.muted }}
              >
                VS
              </Text>
              <View style={{ alignItems: "center" }}>
                <Text
                  allowFontScaling={false}
                  style={{ fontSize: 11, color: COLORS[1] }}
                >
                  1 残り
                </Text>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 30,
                    fontWeight: "900",
                    color: state.counts[1] === 1 ? "#FFE600" : COLORS[1],
                  }}
                >
                  {state.counts[1]}
                </Text>
              </View>
            </View>
            {hudButton("一時停止", "Ⅱ", pause)}
            {hudButton("遊び方", "？", settings)}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
