import { router } from "expo-router";
import { Text } from "react-native";
import { Screen, Heading, EmptyState, Tap } from "@/components/ui";
import { colors } from "@/theme";
export default function Random() {
  return (
    <Screen>
      <Heading
        eyebrow="迷ったら、おまかせ"
        title="何やる？"
        detail="次の遊びとの、偶然の出会い。"
      />
      <EmptyState
        icon="dice-outline"
        title="おまかせ機能、準備中。"
        description="ゲームが登場したら、人数や気分に合う遊びをここから提案します。"
      />
      <Tap
        label="準備中のゲームを見る"
        onPress={() =>
          router.navigate({
            pathname: "/games",
            params: { players: "all", collection: "all" },
          })
        }
        style={{
          padding: 18,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.cyan,
          alignItems: "center",
        }}
      >
        <Text style={{ color: colors.cyan, fontWeight: "700" }}>
          準備中のゲームを見る →
        </Text>
      </Tap>
    </Screen>
  );
}
