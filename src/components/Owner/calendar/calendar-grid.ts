// Geometry for the CSS-grid calendar. Times are wall-clock "YYYY-MM-DDTHH:mm"
// (or bare "HH:mm"), so a block's place is just minutes since midnight.

/** Pixels per minute: a 15-minute row is 20 px, an hour 80 px. */
export const PX_PER_MIN = 80 / 60;
export const ROW_MIN = 15;
const DEFAULT_START = 9 * 60;
const DEFAULT_END = 21 * 60;

export const minutesOf = (t: string | null | undefined) => {
  const m = /(\d{1,2}):(\d{2})$/.exec(t ?? "");
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

export const dayOfStamp = (t: string) => t.slice(0, 10);

/** The hours the grid spans: the salon's hours, widened to fit every item. */
export const gridBounds = (
  hours: Array<{ open: string | null; close: string | null }>,
  items: Array<{ start: string; end: string }>,
) => {
  const starts = [
    ...hours.map((h) => minutesOf(h.open)),
    ...items.map((i) => minutesOf(i.start)),
  ].filter((v): v is number => v !== null);
  const ends = [
    ...hours.map((h) => minutesOf(h.close)),
    ...items.map((i) => minutesOf(i.end)),
  ].filter((v): v is number => v !== null);
  const start = starts.length ? Math.floor(Math.min(...starts) / 60) * 60 : DEFAULT_START;
  const end = ends.length ? Math.ceil(Math.max(...ends) / 60) * 60 : DEFAULT_END;
  return end > start ? { start, end } : { start: DEFAULT_START, end: DEFAULT_END };
};

export type Placed<T> = T & { top: number; height: number; lane: number; lanes: number };

/**
 * Positions items in one column; items that overlap share the width in lanes.
 * `lanes` is per overlap cluster, so a lone block keeps the full width.
 */
export const place = <T extends { start: string; end: string }>(
  items: T[],
  gridStart: number,
): Placed<T>[] => {
  const sorted = items
    .map((item) => {
      const s = minutesOf(item.start) ?? gridStart;
      const e = Math.max(minutesOf(item.end) ?? s + ROW_MIN, s + ROW_MIN);
      return { item, s, e };
    })
    .sort((a, b) => a.s - b.s || a.e - b.e);

  const out: Placed<T>[] = [];
  let cluster: Array<{ item: T; s: number; e: number; lane: number }> = [];
  let clusterEnd = -1;
  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((c) => c.lane + 1));
    for (const c of cluster) {
      out.push({
        ...c.item,
        top: (c.s - gridStart) * PX_PER_MIN,
        height: Math.max((c.e - c.s) * PX_PER_MIN - 2, 18),
        lane: c.lane,
        lanes,
      });
    }
    cluster = [];
  };

  for (const entry of sorted) {
    if (entry.s >= clusterEnd && cluster.length) flush();
    const laneEnds: number[] = [];
    for (const c of cluster) laneEnds[c.lane] = Math.max(laneEnds[c.lane] ?? 0, c.e);
    let lane = laneEnds.findIndex((end) => end <= entry.s);
    if (lane === -1) lane = laneEnds.length;
    cluster.push({ ...entry, lane });
    clusterEnd = Math.max(clusterEnd, entry.e);
  }
  if (cluster.length) flush();
  return out;
};

export const hhmmLabel = (min: number) => {
  const h = Math.floor(min / 60);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1} ${suffix}`;
};

/** Monday of the week containing `day` ("YYYY-MM-DD"). */
export const weekStart = (day: string) => {
  const d = new Date(`${day}T00:00:00Z`);
  const offset = (d.getUTCDay() + 6) % 7;
  return addDay(day, -offset);
};

export const addDay = (day: string, n: number) =>
  new Date(Date.parse(`${day}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

/** "HH:mm" now in Dhaka. */
export const dhakaNow = () =>
  new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString().slice(11, 16);
