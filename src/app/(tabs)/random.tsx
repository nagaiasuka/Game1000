import { useState } from "react";
import { Switch, Text, View } from "react-native";
import { Screen, Heading, Icon, Tap } from "@/components/ui";
import { GameCard } from "@/components/arcade";
import { games } from "@/data/catalog";
import { pickRandomGame, randomCandidates } from "@/data/random-game";
import { useFavorites } from "@/favorites/FavoritesProvider";
import { FavoriteStatus } from "@/favorites/components";
import { useColors } from "@/theme/ThemeProvider";
const options = [
  ["all", "指定なし"],
  ["1", "1人"],
  ["2", "2人"],
  ["3-4", "3〜4人"],
  ["5+", "5人以上"],
] as const;
export default function Random() {
  const c = useColors();
  const { ids, loaded } = useFavorites();
  const [players, setPlayers] = useState("all"),
    [favoritesOnly, setFavoritesOnly] = useState(false),
    [pickedId, setPickedId] = useState<string>();
  const candidates = randomCandidates(
    games,
    players,
    favoritesOnly ? ids : undefined,
  );
  const picked = candidates.find((game) => game.id === pickedId);
  return (
    <Screen>
      <Heading
        eyebrow="迷ったら、おまかせ"
        title="何やる？"
        detail="ひとりでも、ふたりでも。次の遊びを選ぼう。"
      />
      <View style={{ gap: 12 }}>
        <Text style={{ color: c.text, fontWeight: "700" }}>何人で遊ぶ？</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {options.map(([value, label]) => (
            <Tap
              key={value}
              label={label}
              selected={players === value}
              onPress={() => {
                setPlayers(value);
                setPickedId(undefined);
              }}
              style={{
                paddingHorizontal: 16,
                justifyContent: "center",
                borderRadius: 24,
                borderWidth: 1,
                borderColor: players === value ? c.cyan : c.border,
                backgroundColor: c.surface,
              }}
            >
              <Text style={{ color: players === value ? c.cyan : c.text }}>
                {label}
              </Text>
            </Tap>
          ))}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text style={{ color: c.text, flex: 1 }}>お気に入りから選ぶ</Text>
          <Switch
            accessibilityLabel="お気に入りから選ぶ"
            disabled={!loaded}
            value={favoritesOnly}
            onValueChange={(value) => {
              setFavoritesOnly(value);
              setPickedId(undefined);
            }}
            trackColor={{ true: c.cyan }}
          />
        </View>
        <FavoriteStatus />
      </View>
      <View
        style={{
          padding: 24,
          gap: 16,
          alignItems: "center",
          borderRadius: 24,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
        }}
      >
        <Icon name="dice-outline" size={56} color={c.cyan} />
        <Text
          accessibilityLiveRegion="polite"
          style={{
            color: c.text,
            fontSize: 18,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          {candidates.length
            ? `${candidates.length}本から、おまかせ！`
            : "この条件のゲームはまだありません"}
        </Text>
        {candidates.length > 0 ? (
          <Tap
            label={picked ? "もう一度選ぶ" : "おまかせで選ぶ"}
            onPress={() =>
              setPickedId(pickRandomGame(candidates, pickedId)?.id)
            }
            style={{
              backgroundColor: c.cyan,
              padding: 18,
              borderRadius: 16,
              alignSelf: "stretch",
              alignItems: "center",
            }}
          >
            <Text
              style={{ color: c.background, fontWeight: "800", fontSize: 18 }}
            >
              {picked ? "もう一度選ぶ" : "おまかせで選ぶ"}
            </Text>
          </Tap>
        ) : (
          <>
            <Text
              style={{ color: c.muted, textAlign: "center", lineHeight: 24 }}
            >
              {favoritesOnly
                ? "人数を変えるか、ゲーム一覧のハートからお気に入りを追加してみよう。"
                : "今は1人・2人で遊べるゲームを公開しています。"}
            </Text>
            <Tap
              label="条件をリセットする"
              onPress={() => {
                setPlayers("all");
                setFavoritesOnly(false);
                setPickedId(undefined);
              }}
            >
              <Text style={{ color: c.cyan }}>条件をリセットする</Text>
            </Tap>
          </>
        )}
        {candidates.length === 1 && (
          <Text style={{ color: c.muted }}>
            この条件では、この1本が選ばれます。
          </Text>
        )}
      </View>
      {picked && (
        <View style={{ gap: 12 }}>
          <Text
            accessibilityLiveRegion="polite"
            style={{ color: c.text, fontSize: 20, fontWeight: "800" }}
          >
            これで遊ぼう！
          </Text>
          <GameCard game={picked} />
        </View>
      )}
    </Screen>
  );
}
