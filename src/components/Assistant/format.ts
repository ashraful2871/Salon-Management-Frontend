// Small display helpers shared by the blocks. The API sends calendar days as
// `YYYY-MM-DD` and clock times as `HH:mm`, both already in the salon's day
// (Asia/Dhaka) - so these format, they never convert.

/** "09:00" -> "9:00 AM". Anything unexpected comes back untouched. */
export const formatTime = (hhmm: string): string => {
  const [h, m] = hhmm.split(":");
  const hour = Number(h);
  if (!Number.isFinite(hour) || m === undefined) return hhmm;

  const suffix = hour < 12 ? "AM" : "PM";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:${m} ${suffix}`;
};

/** "2026-09-25" -> "Fri 25 Sep". Parsed at midnight local so the day never
 *  slips a date the way `new Date("2026-09-25")` (UTC) does. */
export const formatYmd = (ymd: string): string => {
  const date = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(date.getTime())) return ymd;

  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

/** An ISO instant as the salon's wall clock: "15:45". */
export const formatDhakaClock = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** 90 -> "1 h 30 m", 45 -> "45 min". */
export const formatDuration = (minutes: number): string => {
  if (!Number.isFinite(minutes) || minutes <= 0) return "";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} m` : `${hours} h`;
};
