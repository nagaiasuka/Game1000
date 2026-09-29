import { Platform } from "react-native";
export const colors = {
  background: "#070711",
  surface: "#11111F",
  elevated: "#19192B",
  border: "#292940",
  text: "#F5F5FF",
  muted: "#A3A3BE",
  cyan: "#00F5FF",
  pink: "#FF2BD6",
  purple: "#A88AFF",
  yellow: "#FFE600",
  pinkDark: "#341029",
  purpleDark: "#1D1534",
};
export const space = { xs: 4, sm: 8, md: 12, lg: 20, xl: 28, xxl: 40 };
export const mono = Platform.select({ ios: "Menlo", android: "monospace" });
