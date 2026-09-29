import { ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { GameCard } from "@/components/arcade";
import { Screen, Heading, EmptyState, Tap, s } from "@/components/ui";
import { filterGames, games, playerOptions } from "@/data/catalog";
import { colors } from "@/theme";
export default function Games() {
  const params = useLocalSearchParams<{
    players?: string;
    collection?: string;
  }>();
  const items = filterGames(games, params.players, params.collection);
  const title =
    params.collection === "popular"
      ? "人気のゲーム"
      : params.collection === "new"
        ? "新着ゲーム"
        : "ゲーム一覧";
  return (
    <Screen>
      <Heading
        eyebrow="GAME LIBRARY"
        title={title}
        detail="人数で絞って、ゲームを選ぼう。"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {[{ id: "all", label: "すべて" }, ...playerOptions].map((option) => {
          const selected = option.id === (params.players || "all");
          return (
            <Tap
              key={option.id}
              label={`人数: ${option.label}`}
              selected={selected}
              onPress={() => router.setParams({ players: option.id })}
              style={{
                minHeight: 44,
                paddingHorizontal: 16,
                justifyContent: "center",
                borderRadius: 22,
                borderWidth: 1,
                borderColor: selected ? colors.cyan : colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ color: selected ? colors.cyan : colors.muted }}>
                {option.label}
              </Text>
            </Tap>
          );
        })}
      </ScrollView>
      <View style={s.row}>
        <Text style={s.body}>
          {items.length}件
          {items.every((g) => g.status === "coming-soon") ? " · 準備中" : ""}
        </Text>
        <Tap
          label="絞り込みを解除"
          onPress={() =>
            router.setParams({ players: "all", collection: "all" })
          }
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text style={{ color: colors.cyan, fontSize: 13 }}>すべて表示</Text>
        </Tap>
      </View>
      {items.length ? (
        items.map((game) => <GameCard key={game.id} game={game} />)
      ) : (
        <EmptyState
          icon="game-controller-outline"
          title="ゲームを準備しています"
          description="新しいゲームが登場するまで、もう少しお待ちください。"
        />
      )}
    </Screen>
  );
}
