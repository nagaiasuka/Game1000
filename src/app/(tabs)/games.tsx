import { useColors, useThemedStyles } from "@/theme/ThemeProvider";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { GameCard, PlayerSelector, CategoryLinks } from "@/components/arcade";
import {
  Screen,
  Heading,
  EmptyState,
  Tap,
  s as baseSharedStyles,
} from "@/components/ui";
import { filterGames, games } from "@/data/catalog";
export default function Games() {
  const colors = useColors();
  const s = useThemedStyles(baseSharedStyles);

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
        eyebrow="遊びたいゲームを探そう"
        title={title}
        detail="人数で絞って、ゲームを選ぼう。"
      />
      <PlayerSelector
        selected={params.players}
        onSelect={(players) =>
          router.setParams({
            players: params.players === players ? "all" : players,
          })
        }
      />
      <CategoryLinks />
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
