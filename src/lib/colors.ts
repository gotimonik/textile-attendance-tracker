/**
 * Validated data-visualization palette (see dataviz skill / references/palette.md).
 * Categorical hues are assigned in FIXED order — never cycle or reassign by rank.
 * Status colors are reserved for attendance states and never reused as series colors.
 */

export const CATEGORICAL_PALETTE: { light: string; dark: string; name: string }[] = [
  { name: "blue", light: "#2a78d6", dark: "#3987e5" },
  { name: "orange", light: "#eb6834", dark: "#d95926" },
  { name: "aqua", light: "#1baf7a", dark: "#199e70" },
  { name: "yellow", light: "#eda100", dark: "#c98500" },
  { name: "magenta", light: "#e87ba4", dark: "#d55181" },
  { name: "green", light: "#008300", dark: "#008300" },
  { name: "violet", light: "#4a3aa7", dark: "#9085e9" },
  { name: "red", light: "#e34948", dark: "#e66767" },
];

/** Deterministically pick a categorical color slot for a department, in creation order. */
export function departmentColor(index: number): string {
  return CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length].light;
}

export const STATUS_COLORS = {
  PRESENT: "#0ca30c", // good
  ABSENT: "#d03b3b", // critical
  HALF_DAY: "#fab219", // warning
  LEAVE: "#ec835a", // serious
  HOLIDAY: "#898781", // muted / neutral
} as const;

export const STATUS_LABELS: Record<keyof typeof STATUS_COLORS, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  HALF_DAY: "Half Day",
  LEAVE: "On Leave",
  HOLIDAY: "Holiday",
};

export const SEQUENTIAL_BLUE = {
  100: "#cde2fb",
  200: "#9ec5f4",
  300: "#6da7ec",
  400: "#3987e5",
  500: "#256abf",
  600: "#184f95",
  700: "#0d366b",
};

export const CHART_CHROME = {
  gridline: "#e1e0d9",
  gridlineDark: "#2c2c2a",
  axis: "#c3c2b7",
  axisDark: "#383835",
  mutedText: "#898781",
};
