import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BRAND } from "@/data/brand";
import { useProjectProgress } from "@/hooks/useProjectProgress";
import { japaneseDate } from "@/utils/project";
import { colors as c, mono } from "@/theme";
import { Icon, Tap, s } from "./ui";

export function ProjectProgress({ link = false }: { link?: boolean }) {
  const progress = useProjectProgress();
  const content = (
    <LinearGradient
      colors={["#13232D", c.surface, c.purpleDark]}
      style={styles.panel}
    >
      <View style={s.row}>
        <Text accessibilityRole="header" style={styles.eyebrow}>
          ROAD TO {BRAND.targetGames}
        </Text>
        <Icon name="sparkles-outline" size={18} color={c.cyan} />
      </View>
      <Text style={styles.tagline}>
        {japaneseDate(BRAND.deadline)}までに{"\n"}ゲーム{BRAND.targetGames}
        本を作る会社員。
      </Text>
      <View style={styles.voices}>
        <Icon name="chatbubbles-outline" size={20} color={c.pink} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.voiceTitle}>次のゲームは、あなたの声から。</Text>
          <Text style={styles.voiceCopy}>
            「こんなの遊びたい」をヒントに、次の1本を決めていきます。
          </Text>
        </View>
      </View>
      <View style={styles.countRow}>
        <View>
          <Text style={styles.label}>現在 / GAMES</Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.count}>
            {String(progress.available).padStart(3, "0")}
            <Text style={styles.total}> / {BRAND.targetGames}</Text>
          </Text>
        </View>
        <Text style={styles.remaining}>{progress.remaining} GAMES LEFT</Text>
      </View>
      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityLabel="ゲーム制作の進捗"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: progress.percent,
          text: `${progress.countLabel}、${progress.percent}%`,
        }}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${progress.percent}%`,
              minWidth: progress.percent > 0 ? 4 : 0,
            },
          ]}
        />
      </View>
      <View style={s.row}>
        <Text style={styles.label}>制作進捗</Text>
        <Text style={styles.percent}>
          {Number(progress.percent.toFixed(1))}%
        </Text>
      </View>
      <View style={styles.deadline}>
        <View style={{ gap: 5 }}>
          <Text style={styles.label}>DEADLINE</Text>
          <Text style={styles.date}>{BRAND.deadline.replaceAll("-", ".")}</Text>
        </View>
        <Text style={styles.days}>
          {progress.expired
            ? "PROJECT CONTINUES"
            : `あと ${progress.daysLeft.toLocaleString()} DAYS`}
        </Text>
      </View>
      {link && (
        <View style={styles.link}>
          <Text style={styles.linkText}>みんなと作る、この挑戦について</Text>
          <Icon name="arrow-forward" size={16} color={c.cyan} />
        </View>
      )}
    </LinearGradient>
  );
  return link ? (
    <Tap
      label={`ROAD TO ${BRAND.targetGames}。現在${progress.available}本、残り${progress.remaining}本。企画について読む`}
      onPress={() => router.push("/project")}
      style={styles.frame}
    >
      {content}
    </Tap>
  ) : (
    <View style={styles.frame}>{content}</View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: 1,
    borderColor: c.cyan + "80",
    borderRadius: 18,
    overflow: "hidden",
  },
  panel: { padding: 18, gap: 12 },
  eyebrow: {
    color: c.cyan,
    fontFamily: mono,
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 2,
  },
  tagline: { color: c.text, fontSize: 15, lineHeight: 25, fontWeight: "700" },
  voices: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  voiceTitle: {
    color: c.pink,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 21,
  },
  voiceCopy: { color: c.muted, fontSize: 12, lineHeight: 19 },
  countRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
  },
  label: { color: c.muted, fontSize: 9, fontFamily: mono, letterSpacing: 1 },
  count: { color: c.cyan, fontFamily: mono, fontSize: 40, fontWeight: "800" },
  total: { color: c.muted, fontSize: 20 },
  remaining: {
    color: c.pink,
    fontFamily: mono,
    fontSize: 11,
    fontWeight: "700",
    paddingBottom: 6,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: c.background,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 4, backgroundColor: c.cyan },
  percent: { color: c.cyan, fontSize: 11, fontFamily: mono },
  deadline: {
    borderTopWidth: 1,
    borderTopColor: c.border,
    paddingTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  date: { color: c.text, fontFamily: mono, fontSize: 14, fontWeight: "700" },
  days: { color: c.yellow, fontSize: 11, fontFamily: mono },
  link: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    minHeight: 24,
  },
  linkText: { color: c.cyan, fontSize: 11 },
});
