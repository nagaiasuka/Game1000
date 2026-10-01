import { Text, View, Pressable } from "react-native";
import { Screen, Heading } from "@/components/ui";
import { SoundControls } from "@/audio/SoundSettings";
import { audio } from "@/audio/native";
import { useAppTheme, useColors } from "@/theme/ThemeProvider";
import { GameLogo } from "@/components/arcade";
import { MAIN_COLORS } from "@/theme/preferences";
export default function Settings() {
  const c = useColors();
  const { mainColor, loaded, error, select } = useAppTheme();
  return (
    <Screen>
      <Heading
        eyebrow="自分好みに"
        title="設定"
        detail="色と音を選んで、あなたのゲームセンターに。"
      />
      <View
        style={{
          padding: 18,
          borderRadius: 18,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
          gap: 16,
        }}
      >
        <Text
          accessibilityRole="header"
          style={{ color: c.text, fontSize: 18, fontWeight: "700" }}
        >
          テーマ・メインカラー
        </Text>
        <View
          style={{
            borderColor: c.cyan + "80",
            borderWidth: 1,
            padding: 18,
            borderRadius: 14,
            backgroundColor: c.cyan + "0C",
            gap: 8,
          }}
        >
          <GameLogo compact />
          <Text style={{ color: c.cyan, fontSize: 14 }}>
            あなたの好きな色で、遊ぼう。
          </Text>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {MAIN_COLORS.map((option) => {
            const selected = option.id === mainColor;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{ checked: selected, disabled: !loaded }}
                disabled={!loaded}
                onPress={() => {
                  select(option.id);
                  audio.play("ui");
                }}
                style={({ pressed }) => ({
                  width: "48%",
                  minHeight: 80,
                  padding: 10,
                  borderRadius: 12,
                  gap: 8,
                  borderWidth: 2,
                  borderColor: selected ? option.color : c.border,
                  backgroundColor: selected
                    ? option.color + "14"
                    : c.background,
                  opacity: pressed ? 0.65 : 1,
                })}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: option.color,
                  }}
                />
                <Text
                  style={{
                    color: c.text,
                    fontSize: 14,
                    fontWeight: selected ? "800" : "500",
                  }}
                >
                  {selected ? "✓ " : ""}
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={{ color: c.muted, fontSize: 14, lineHeight: 21 }}>
          ロゴ・ボタン・選択中の表示に反映されます。ゲームのコマやブロックの色は、そのままです。
        </Text>
        {!!error && (
          <Text accessibilityLiveRegion="polite" style={{ color: c.yellow }}>
            {error}
          </Text>
        )}
      </View>
      <View
        style={{
          padding: 18,
          borderRadius: 18,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
        }}
      >
        <SoundControls />
      </View>
    </Screen>
  );
}
