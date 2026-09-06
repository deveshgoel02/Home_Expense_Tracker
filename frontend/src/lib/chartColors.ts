// Validated categorical palette (see dataviz skill reference/palette.md).
// Order is fixed and must not be re-cycled — each slot is CVD-safe against
// its neighbors in this exact sequence. Both light and dark columns are the
// same eight hues stepped for their respective surface.
export const CATEGORICAL_LIGHT = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
];

export const CATEGORICAL_DARK = [
  "#3987e5", // blue
  "#d95926", // orange
  "#199e70", // aqua
  "#c98500", // yellow
  "#d55181", // magenta
  "#008300", // green
  "#9085e9", // violet
  "#e66767", // red
];

export const OTHER_SLICE_COLOR_LIGHT = "#c3c2b7"; // muted, out-of-band
export const OTHER_SLICE_COLOR_DARK = "#52514e";

// Single-hue sequential ramp (blue) for magnitude-only charts (one series).
export const SEQUENTIAL_BLUE_LIGHT = "#2a78d6";
export const SEQUENTIAL_BLUE_DARK = "#3987e5";

export const CHART_CHROME_LIGHT = {
  gridline: "#e1e0d9",
  axis: "#c3c2b7",
  mutedText: "#898781",
  secondaryText: "#52514e",
  tooltipBg: "#fcfcfb",
  tooltipBorder: "#e1e0d9",
};

export const CHART_CHROME_DARK = {
  gridline: "#2c2c2a",
  axis: "#383835",
  mutedText: "#898781",
  secondaryText: "#c3c2b7",
  tooltipBg: "#1a1a19",
  tooltipBorder: "#2c2c2a",
};

export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
};

// Legacy light-mode exports (kept for any call sites that haven't switched to
// the theme-aware hook below).
export const CATEGORICAL = CATEGORICAL_LIGHT;
export const OTHER_SLICE_COLOR = OTHER_SLICE_COLOR_LIGHT;
export const SEQUENTIAL_BLUE = SEQUENTIAL_BLUE_LIGHT;
export const CHART_CHROME = CHART_CHROME_LIGHT;

export interface ChartPalette {
  categorical: string[];
  otherSlice: string;
  sequentialBlue: string;
  chrome: typeof CHART_CHROME_LIGHT;
}

export function getChartPalette(isDark: boolean): ChartPalette {
  return isDark
    ? { categorical: CATEGORICAL_DARK, otherSlice: OTHER_SLICE_COLOR_DARK, sequentialBlue: SEQUENTIAL_BLUE_DARK, chrome: CHART_CHROME_DARK }
    : { categorical: CATEGORICAL_LIGHT, otherSlice: OTHER_SLICE_COLOR_LIGHT, sequentialBlue: SEQUENTIAL_BLUE_LIGHT, chrome: CHART_CHROME_LIGHT };
}
