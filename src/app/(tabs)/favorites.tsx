import { router } from "expo-router";
import { Text, View } from "react-native";
import { Screen, Heading, Icon, Tap } from "@/components/ui";
import { GameCard } from "@/components/arcade";
import { games } from "@/data/catalog";
import { useFavorites } from "@/favorites/FavoritesProvider";
import { FavoriteStatus } from "@/favorites/components";
import { useColors } from "@/theme/ThemeProvider";
export default function Favorites() {
  const c = useColors(),
    { ids, loaded } = useFavorites();
  const favorites = [...ids]
    .reverse()
    .flatMap((id) =>
      games.filter((game) => game.id === id && game.status === "available"),
    );
  return (
    <Screen>
      <Heading
        eyebrow="好きなゲームを集めよう"
        title="お気に入り"
        detail={
          loaded && favorites.length
            ? `${favorites.length}本の「また遊びたい」が見つかりました。`
            : "また遊びたい、を集めよう。"
        }
      />
      <FavoriteStatus />
      {loaded &&
        (favorites.length ? (
          favorites.map((game) => <GameCard key={game.id} game={game} />)
        ) : (
          <View
            style={{
              alignItems: "center",
              gap: 20,
              backgroundColor: c.surface,
              borderRadius: 24,
              padding: 28,
            }}
          >
            <Icon name="heart-outline" size={52} color={c.pink} />
            <Text
              style={{
                color: c.text,
                fontWeight: "700",
                fontSize: 18,
                textAlign: "center",
              }}
            >
              とっておきの遊びを、ここに。
            </Text>
            <Text
              style={{ color: c.muted, lineHeight: 24, textAlign: "center" }}
            >
              ゲーム一覧のハートを押すと登録できます。好きなゲームをすぐに遊べる、自分だけのコレクションに。
            </Text>
          </View>
        ))}
      <Tap
        label="ゲーム一覧から探す"
        onPress={() =>
          router.navigate({
            pathname: "/games",
            params: { players: "all", collection: "all" },
          })
        }
        style={{
          padding: 16,
          borderRadius: 16,
          borderColor: c.cyan,
          borderWidth: 1,
          alignItems: "center",
        }}
      >
        <Text style={{ color: c.cyan, fontWeight: "700" }}>
          ゲーム一覧から探す →
        </Text>
      </Tap>
    </Screen>
  );
}
