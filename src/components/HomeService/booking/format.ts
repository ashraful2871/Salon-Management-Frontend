/** Shared by the booking pages (server) and their client parts. Times are Dhaka's. */

export const timeText = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Dhaka" });

/** "Thu, 30 Oct" from YYYY-MM-DD. */
export const dayText = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export const BD_MOBILE = /^01[3-9]\d{8}$/;

/** "+880 1712-345678" → "01712345678"; anything else is returned trimmed. */
export const normalizePhone = (v: string) => {
  const digits = v.replace(/[^\d]/g, "");
  if (digits.startsWith("880") && digits.length === 13) return `0${digits.slice(3)}`;
  return digits || v.trim();
};
