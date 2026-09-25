// Custom DivIcons: no image requests, and they sidestep Leaflet's default
// marker image paths, which break under bundlers. Only import this from
// files that are loaded client-side (leaflet touches `window`).
import L from "leaflet";

// Teardrop in a 24x32 box; the tip is at (12, 32). Drawn in a viewBox padded
// by 2 on each side so the stroke isn't clipped, so the tip sits at (14, 34).
const PIN_PATH =
  "M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20C24 5.373 18.627 0 12 0z";
const BASE_W = 28;
const BASE_H = 36;
const TIP_X = 14;
const TIP_Y = 34;

const cache = new Map<string, L.DivIcon>();

export function salonPin({
  active = false,
  approximate = false,
}: { active?: boolean; approximate?: boolean } = {}): L.DivIcon {
  const key = `${active ? 1 : 0}${approximate ? 1 : 0}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const scale = active ? 1.2 : 1;
  const w = Math.round(BASE_W * scale);
  const h = Math.round(BASE_H * scale);

  const fill = active ? "var(--gold-dark)" : "var(--gold)";
  const outline = approximate
    ? "stroke:var(--gold-dark);stroke-dasharray:3 2;fill-opacity:.75"
    : "stroke:#fff";

  const html = `<svg width="${w}" height="${h}" viewBox="-2 -2 ${BASE_W} ${BASE_H}" aria-hidden="true" focusable="false" style="display:block;overflow:visible;filter:drop-shadow(0 2px 3px rgb(0 0 0 / .35))"><path d="${PIN_PATH}" style="fill:${fill};stroke-width:2;${outline}"/><circle cx="12" cy="12" r="4.5" fill="#fff"/></svg>`;

  const icon = L.divIcon({
    className: "sm-map-pin",
    html,
    iconSize: [w, h],
    iconAnchor: [Math.round(TIP_X * scale), Math.round(TIP_Y * scale)],
    popupAnchor: [0, -Math.round(TIP_Y * scale)],
    tooltipAnchor: [0, -Math.round(TIP_Y * scale)],
  });
  cache.set(key, icon);
  return icon;
}

let userIcon: L.DivIcon | null = null;

// Pulsing blue "you are here" dot. Styles live in ./map.css.
export function userDot(): L.DivIcon {
  userIcon ??= L.divIcon({
    className: "sm-map-pin",
    html: '<span class="sm-user-dot" aria-hidden="true"></span>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
  return userIcon;
}

// Gold count bubble for a marker cluster. Sized by magnitude so a cluster of
// 120 reads bigger than one of 3. Styles live in ./map.css.
export function clusterIcon(count: number): L.DivIcon {
  const size = count < 10 ? 34 : count < 100 ? 40 : 46;
  return L.divIcon({
    className: "sm-map-pin",
    html: `<span class="sm-cluster" style="width:${size}px;height:${size}px">${count}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
