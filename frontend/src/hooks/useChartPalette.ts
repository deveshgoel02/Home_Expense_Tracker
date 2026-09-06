import { useTheme } from "../context/ThemeContext";
import { getChartPalette } from "../lib/chartColors";

export function useChartPalette() {
  const { theme } = useTheme();
  return getChartPalette(theme === "dark");
}
