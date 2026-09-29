import { Text, View } from "react-native";
import { router } from "expo-router";
import {
  GameLogo,
  RandomGameButton,
  PlayerSelector,
  CategoryLinks,
} from "@/components/arcade";
import { Screen, Tap, Icon, s } from "@/components/ui";
import { BlockDropArtwork } from "@/components/game-artwork";
import { ProjectProgress } from "@/components/project-progress";
import { games } from "@/data/catalog";
import { BRAND } from "@/data/brand";
import { colors } from "@/theme";
export default function Home() {
  return (
    <Screen>
      <View style={s.row}>
        <Text style={s.eyebrow}>LET’S BUILD THE ARCADE</Text>
        <Icon name="sparkles-outline" size={15} color={colors.cyan} />
      </View>
      <GameLogo />
      <View style={{ gap: 7 }}>
        <Text
          accessibilityRole="header"
          style={[s.title, { fontSize: 27, lineHeight: 38 }]}
        >
          みんなの声で、{"\n"}育つゲームセンター。
        </Text>
        <Text style={s.body}>ひとりでも、みんなでも。遊んで、次の遊びへ。</Text>
      </View>
      <ProjectProgress link />
      <View style={{ gap: 6 }}>
        <Text style={[s.eyebrow, { color: colors.cyan }]}>PLAY THE LATEST</Text>
        <Text accessibilityRole="header" style={s.subtitle}>
          まずは、できたての1本から。
        </Text>
      </View>
      {games
        .filter((game) => game.status === "available" && game.isNew)
        .slice(0, 1)
        .map((game) => (
          <Tap
            key={game.id}
            label={`${game.title}を遊ぶ`}
            onPress={() => {
              if (game.status === "available")
                router.push(game.route as Parameters<typeof router.push>[0]);
            }}
            style={{
              borderColor: colors.cyan,
              borderWidth: 1,
              borderRadius: 16,
              overflow: "hidden",
              backgroundColor: colors.surface,
            }}
          >
            {game.artwork === "block-drop" && <BlockDropArtwork />}
            <View
              style={{ paddingHorizontal: 14, paddingVertical: 11, gap: 5 }}
            >
              <Text style={[s.eyebrow, { color: colors.cyan }]}>
                NEW · GAME #{String(game.gameNumber).padStart(3, "0")}
              </Text>
              <View style={s.row}>
                <Text style={[s.subtitle, { flex: 1, fontSize: 16 }]}>
                  {game.title}
                </Text>
                <Icon
                  name="play-circle-outline"
                  size={24}
                  color={colors.cyan}
                />
              </View>
              <Text style={[s.body, { fontSize: 11, lineHeight: 16 }]}>
                {game.shortDescription}
              </Text>
            </View>
          </Tap>
        ))}
      <RandomGameButton />
      <PlayerSelector />
      <CategoryLinks />
      <Tap
        label="ゲームをすべて見る"
        onPress={() =>
          router.navigate({
            pathname: "/games",
            params: { players: "all", collection: "all" },
          })
        }
        style={{
          minHeight: 76,
          padding: 18,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <View style={{ gap: 5, flex: 1 }}>
          <Text style={s.subtitle}>ゲーム一覧から探す</Text>
          <Text style={s.body}>遊びたいゲームが決まっているなら</Text>
        </View>
        <Icon name="arrow-forward" color={colors.cyan} />
      </Tap>
      <Text style={[s.eyebrow, { textAlign: "center", fontSize: 9 }]}>
        {BRAND.targetGames} GAMES. ENDLESS GOOD TIMES.
      </Text>
    </Screen>
  );
}
