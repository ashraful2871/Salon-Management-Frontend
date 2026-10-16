/** "just now", "5 min ago", "3 h ago", "2 d ago", then the date. */
export const timeAgo = (iso: string, now: number) => {
  const minutes = Math.max(Math.floor((now - new Date(iso).getTime()) / 60_000), 0);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};
