// Validated categorical palette (see dataviz skill reference/palette.md).
// Order is fixed and must not be re-cycled — each slot is CVD-safe against
// its neighbors in this exact sequence.
export const CATEGORICAL = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
];

export const OTHER_SLICE_COLOR = "#c3c2b7"; // muted, out-of-band

// Single-hue sequential ramp (blue) for magnitude-only charts (one series).
export const SEQUENTIAL_BLUE = "#2a78d6";

export const CHART_CHROME = {
  gridline: "#e1e0d9",
  axis: "#c3c2b7",
  mutedText: "#898781",
  secondaryText: "#52514e",
};

export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
};
