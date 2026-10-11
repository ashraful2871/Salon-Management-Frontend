/**
 * The finance pages' date presets until Phase 11's DateRangeFilter: the URL
 * holds `?range=7d|30d|90d|all` (and `includeTest=1`), and the API gets
 * Dhaka calendar days as `from` / `to`.
 */
export const RANGE_PRESETS = [
  { value: "7d", label: "7 days", days: 7 },
  { value: "30d", label: "30 days", days: 30 },
  { value: "90d", label: "90 days", days: 90 },
  { value: "all", label: "All time", days: null },
] as const;

export type RangePreset = (typeof RANGE_PRESETS)[number]["value"];

export const DEFAULT_RANGE: RangePreset = "30d";

const dhakaDay = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(date);

export const parsePreset = (value: string | undefined): RangePreset =>
  RANGE_PRESETS.some((p) => p.value === value) ? (value as RangePreset) : DEFAULT_RANGE;

/** `{ from, to }` as YYYY-MM-DD (Dhaka), or nothing for "all". */
export const presetRange = (preset: RangePreset): { from?: string; to?: string } => {
  const days = RANGE_PRESETS.find((p) => p.value === preset)?.days;
  if (!days) return {};
  const now = new Date();
  return {
    from: dhakaDay(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000)),
    to: dhakaDay(now),
  };
};

export const isOn = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) === "1";
