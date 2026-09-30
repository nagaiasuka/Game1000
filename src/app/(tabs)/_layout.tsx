import { Text } from "react-native";
import { useColors } from "@/theme/ThemeProvider";
import { audio } from "@/audio/native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, type IconName } from "@/components/ui";
const tabs: { name: string; title: string; label: string; icon: IconName }[] = [
  { name: "index", title: "HOME", label: "ホーム", icon: "home-outline" },
  {
    name: "games",
    title: "GAMES",
    label: "ゲーム一覧",
    icon: "game-controller-outline",
  },
  { name: "random", title: "RANDOM", label: "何やる？", icon: "dice-outline" },
  {
    name: "favorites",
    title: "FAVORITES",
    label: "お気に入り",
    icon: "heart-outline",
  },
  {
    name: "settings",
    title: "SETTINGS",
    label: "設定",
    icon: "settings-outline",
  },
];
export default function TabLayout() {
  const c = useColors();

  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenListeners={{ tabPress: () => audio.play("ui") }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.cyan,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: {
          backgroundColor: c.background,
          borderTopColor: c.border,
          height: 64 + Math.max(insets.bottom, 10),
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.6,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarLabel: ({ color }) => (
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={1.1}
                style={{ color, fontSize: 11, fontWeight: "700" }}
              >
                {tab.label}
              </Text>
            ),
            tabBarAccessibilityLabel: tab.label,
            tabBarIcon: ({ color }) => <Icon name={tab.icon} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
