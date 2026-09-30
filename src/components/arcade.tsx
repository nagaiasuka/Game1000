import { CATEGORY_LABELS } from "@/data/catalog";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  availableCount,
  games,
  playerOptions,
  type Game,
} from "@/data/catalog";
import { colors as c, mono } from "@/theme";
import { BRAND } from "@/data/brand";
import {
  BlockDropArtwork,
  BlockBreakArtwork,
  NeonStackArtwork,
} from "./game-artwork";
import { Icon, Tap, s, type IconName } from "./ui";
export function GameLogo() {
  return (
    <View
      accessible
      accessibilityLabel={`${BRAND.displayName}、${BRAND.reading}`}
      style={a.logo}
    >
      <Text maxFontSizeMultiplier={1.3} style={a.game}>
        GAME<Text style={a.thousand}>{BRAND.targetGames}</Text>
        <Text style={{ fontSize: 12, color: c.pink }}> ✦</Text>
      </Text>
      <Text style={a.logoSub}>{BRAND.reading} / ポケットのゲームセンター</Text>
    </View>
  );
}
export function GameCounter() {
  return (
    <View style={a.counter}>
      <View>
        <Text style={s.eyebrow}>遊べるゲーム</Text>
        <Text style={a.count}>
          {String(availableCount(games)).padStart(3, "0")}
          <Text style={a.total}> / {BRAND.targetGames}</Text>
        </Text>
      </View>
      <View style={a.counterRight}>
        <View style={a.dot} />
        <Text style={a.counterNote}>
          ここから、{BRAND.targetGames}の遊びへ。
        </Text>
      </View>
    </View>
  );
}
export function RandomGameButton() {
  return (
    <Tap
      label="何やる？ ランダム画面を開く"
      onPress={() => router.navigate("/random")}
      style={a.random}
    >
      <LinearGradient
        colors={[c.pinkDark, c.purpleDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={a.randomInner}
      >
        <View style={{ gap: 9, flex: 1 }}>
          <Text style={[s.eyebrow, { color: c.pink }]}>迷ったら、ここから</Text>
          <Text style={a.randomTitle}>何やる？</Text>
          <Text style={{ color: c.text, fontSize: 12 }}>
            迷ったら、おまかせ。
          </Text>
        </View>
        <View style={a.dice}>
          <Icon name="dice-outline" size={57} color={c.pink} />
        </View>
        <Icon name="arrow-forward" color={c.pink} size={20} />
      </LinearGradient>
    </Tap>
  );
}
const accents = [c.cyan, c.pink, c.purple, c.yellow];
const peopleIcons: IconName[] = [
  "person-outline",
  "people-outline",
  "people-circle-outline",
  "happy-outline",
];
export function PlayerSelector({
  selected,
  onSelect,
}: {
  selected?: string;
  onSelect?: (id: string) => void;
}) {
  return (
    <View style={{ gap: 14 }}>
      <View style={s.row}>
        <Text style={s.eyebrow}>人数から探す</Text>
        <Text style={s.body}>何人で遊ぶ？</Text>
      </View>
      <View style={a.players}>
        {playerOptions.map((p, i) => (
          <Tap
            key={p.id}
            label={`${p.label}ゲームを探す`}
            selected={selected === p.id}
            onPress={() =>
              onSelect
                ? onSelect(p.id)
                : router.navigate({
                    pathname: "/games",
                    params: { players: p.id, collection: "all" },
                  })
            }
            style={[
              a.player,
              {
                borderColor: selected === p.id ? accents[i] : accents[i] + "55",
              },
            ]}
          >
            <Icon name={peopleIcons[i]} color={accents[i]} size={25} />
            <Text style={a.playerLabel}>{p.label}</Text>
            <Text style={[a.playerCaption, { color: accents[i] }]}>
              {selected === p.id ? "✓ 選択中" : p.caption}
            </Text>
          </Tap>
        ))}
      </View>
    </View>
  );
}
export function CategoryLinks() {
  const items = [
    {
      label: "人気",
      icon: "flame-outline",
      path: "/games",
      collection: "popular",
    },
    {
      label: "新着",
      icon: "sparkles-outline",
      path: "/games",
      collection: "new",
    },
    { label: "ランダム", icon: "shuffle-outline", path: "/random" },
    { label: "お気に入り", icon: "heart-outline", path: "/favorites" },
  ] as const;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
    >
      {items.map((item) => (
        <Tap
          key={item.label}
          label={item.label}
          onPress={() =>
            item.path === "/games"
              ? router.navigate({
                  pathname: "/games",
                  params: { collection: item.collection, players: "all" },
                })
              : router.navigate(item.path)
          }
          style={a.chip}
        >
          <Icon name={item.icon} size={17} color={c.muted} />
          <Text style={{ color: c.text, fontSize: 13 }}>{item.label}</Text>
        </Tap>
      ))}
    </ScrollView>
  );
}
export function GameCard({ game }: { game: Game }) {
  const accent = accents[(game.gameNumber - 1) % accents.length];
  const body = (
    <>
      {game.artwork === "block-drop" ? (
        <BlockDropArtwork />
      ) : game.artwork === "block-break" ? (
        <BlockBreakArtwork />
      ) : game.artwork === "neon-stack" ? (
        <NeonStackArtwork />
      ) : (
        <View style={[a.art, { borderBottomColor: accent + "44" }]}>
          <View style={[a.orbit, { borderColor: accent + "22" }]} />
          <Text style={[a.artNumber, { color: accent + "22" }]}>
            {String(game.gameNumber).padStart(3, "0")}
          </Text>
          <Icon
            name={
              game.status === "available"
                ? "game-controller-outline"
                : "lock-closed-outline"
            }
            size={30}
            color={accent}
          />
          <Text style={[a.artLabel, { color: accent }]}>
            {game.status === "available" ? "遊べます" : "次のゲームを制作中！"}
          </Text>
        </View>
      )}
      <View style={a.cardContent}>
        <View style={s.row}>
          <Text style={[a.cardMeta, { color: accent }]}>
            GAME #{String(game.gameNumber).padStart(3, "0")}
          </Text>
          <Text style={a.cardMeta}>
            {game.minPlayers === game.maxPlayers
              ? game.minPlayers
              : `${game.minPlayers}〜${game.maxPlayers}`}
            人{game.estimatedMinutes ? ` · 約${game.estimatedMinutes}分` : ""}
          </Text>
        </View>
        <View style={s.row}>
          <Text style={a.cardTitle}>{game.title}</Text>
          <Icon
            name={
              game.status === "available"
                ? "play-circle-outline"
                : "lock-closed-outline"
            }
            size={22}
            color={accent}
          />
        </View>
        <Text style={a.cardDescription}>{game.shortDescription}</Text>
        <Text style={a.cardMeta}>
          {game.categories
            .map((category) => CATEGORY_LABELS[category])
            .join("・")}{" "}
          · {game.status === "available" ? "タップして遊ぶ" : "準備中"}
        </Text>
      </View>
    </>
  );
  return game.status === "available" ? (
    <Tap
      label={`${game.title}を遊ぶ`}
      onPress={() =>
        router.push(game.route as Parameters<typeof router.push>[0])
      }
      style={a.card}
    >
      {body}
    </Tap>
  ) : (
    <View
      style={a.card}
      accessible
      accessibilityLabel={`GAME ${game.gameNumber}、準備中。${game.shortDescription}`}
    >
      {body}
    </View>
  );
}
const a = StyleSheet.create({
  logo: { gap: 6 },
  game: {
    color: c.text,
    fontSize: 38,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: -2,
  },
  thousand: {
    color: c.cyan,
    textShadowColor: c.cyan + "66",
    textShadowRadius: 16,
    textShadowOffset: { width: 0, height: 0 },
  },
  logoSub: {
    color: c.muted,
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: "600",
  },
  counter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    paddingVertical: 17,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: c.border,
  },
  count: {
    color: c.cyan,
    fontSize: 28,
    fontFamily: mono,
    fontWeight: "700",
    marginTop: 6,
  },
  total: { color: c.muted, fontSize: 15 },
  counterRight: {
    flexShrink: 1,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: c.cyan },
  counterNote: { color: c.muted, fontSize: 10, flexShrink: 1 },
  random: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.pink + "AA",
    overflow: "hidden",
  },
  randomInner: {
    padding: 20,
    minHeight: 150,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  randomTitle: {
    color: c.text,
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 1,
  },
  dice: { transform: [{ rotate: "-15deg" }] },
  players: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  player: {
    width: "48%",
    minHeight: 105,
    paddingVertical: 14,
    paddingHorizontal: 2,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: c.surface,
    alignItems: "center",
    gap: 9,
  },
  playerLabel: { color: c.text, fontSize: 14, fontWeight: "800" },
  playerCaption: { fontSize: 12, fontFamily: mono, letterSpacing: 1 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 24,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    overflow: "hidden",
  },
  art: {
    height: 142,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
    overflow: "hidden",
    borderBottomWidth: 1,
  },
  artNumber: {
    position: "absolute",
    fontSize: 116,
    fontFamily: mono,
    fontWeight: "900",
    right: 12,
    top: -10,
  },
  orbit: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 1,
    left: -50,
    top: -90,
  },
  artLabel: { fontSize: 8, fontFamily: mono, letterSpacing: 3 },
  cardContent: { paddingHorizontal: 14, paddingVertical: 11, gap: 4 },
  cardMeta: { color: c.muted, fontSize: 12, fontFamily: mono },
  cardDescription: { color: c.text, fontSize: 14, lineHeight: 22 },
  cardTitle: {
    color: c.text,
    fontSize: 16,
    fontWeight: "800",
    flex: 1,
  },
  badge: {
    color: c.muted,
    fontSize: 10,
    backgroundColor: c.elevated,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
});
