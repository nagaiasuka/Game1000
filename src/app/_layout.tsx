import { AppThemeProvider, useColors } from "@/theme/ThemeProvider";
import { AudioProvider } from "@/audio/AudioProvider";
import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { DeveloperModeProvider } from "@/developer/DeveloperMode";
export default function RootLayout() {
  return (
    <AppThemeProvider>
      <AppNavigation />
    </AppThemeProvider>
  );
}
function AppNavigation() {
  const colors = useColors();

  return (
    <AudioProvider>
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
            <Stack.Screen name="play/003" options={{ gestureEnabled: false }} />
            <Stack.Screen name="play/004" options={{ gestureEnabled: false }} />
            <Stack.Screen name="play/005" options={{ gestureEnabled: false }} />
          </Stack>
        </ThemeProvider>
      </DeveloperModeProvider>
    </AudioProvider>
  );
}
