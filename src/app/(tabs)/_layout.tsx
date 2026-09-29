import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, type IconName } from "@/components/ui";
import { colors as c } from "@/theme";
const tabs: { name: string; title: string; label: string; icon: IconName }[] = [
  { name: "index", title: "HOME", label: "ホーム", icon: "home-outline" },
  {
    name: "games",
    title: "GAMES",
    label: "ゲーム一覧",
    icon: "game-controller-outline",
  },
  { name: "random", title: "RANDOM", label: "ランダム", icon: "dice-outline" },
  {
    name: "favorites",
    title: "FAVORITES",
    label: "お気に入り",
    icon: "heart-outline",
  },
];
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
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
          fontSize: 9,
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
            title: tab.title,
            tabBarAccessibilityLabel: tab.label,
            tabBarIcon: ({ color }) => <Icon name={tab.icon} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
