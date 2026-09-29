import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { colors } from "@/theme";
import { DeveloperModeProvider } from "@/developer/DeveloperMode";
export default function RootLayout() {
  return (
    <DeveloperModeProvider>
      <ThemeProvider
        value={{
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            primary: colors.cyan,
            border: colors.border,
          },
        }}
      >
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="play/001" options={{ gestureEnabled: false }} />
          <Stack.Screen name="play/002" options={{ gestureEnabled: false }} />
        </Stack>
      </ThemeProvider>
    </DeveloperModeProvider>
  );
}
