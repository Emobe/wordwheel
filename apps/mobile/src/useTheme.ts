import { useColorScheme } from "react-native";
import { darkTheme, lightTheme, type Theme } from "./theme";

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === "dark" ? darkTheme : lightTheme;
}

export function useColorSchemeName(): "light" | "dark" {
  return useColorScheme() === "dark" ? "dark" : "light";
}
