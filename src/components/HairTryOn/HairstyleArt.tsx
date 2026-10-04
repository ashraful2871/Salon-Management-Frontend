import { cn } from "@/lib/utils";
import { artFor, isFade, type HairArt } from "./hairArt";

export const DEFAULT_HAIR = "#2a201b";

// [face, shadow] pairs.
const SKIN = {
  medium: ["#b07a55", "#96603f"],
  deep: ["#8a5a3c", "#6f452c"],
  light: ["#d6a47f", "#bb8662"],
} as const;

export type Skin = keyof typeof SKIN;

// "bust" is the drawing as made; "thumb" adds headroom for square cards;
// "portrait" leaves room around it for a large 4:5 frame.
const VIEWBOX = {
  bust: "0 0 200 240",
  thumb: "-10 -4 220 244",
  portrait: "-25 -60 250 300",
} as const;

/**
 * A flat illustration of one hairstyle on a neutral bust. Not a photo of
 * anyone, so it is safe to show before a visitor uploads their own.
 */
export function HairstyleArt({
  styleId,
  group,
  art,
  hair,
  skin = "medium",
  outfit = "#3d3833",
  framing = "bust",
  className,
  title,
}: {
  styleId?: string;
  group?: string;
  /** Draw this instead of a catalog style (the demo's "before"). */
  art?: HairArt;
  /** CSS colour; "transparent" or empty means the default dark brown. */
  hair?: string;
  skin?: Skin;
  outfit?: string;
  framing?: keyof typeof VIEWBOX;
  className?: string;
  /** Accessible name; without it the drawing is decorative. */
  title?: string;
}) {
  const shape = art ?? artFor(styleId ?? "", group);
  const fill = hair && hair !== "transparent" ? hair : DEFAULT_HAIR;
  const [tone, shade] = SKIN[skin];
  const fade = !art && isFade(styleId ?? "", group);

  return (
    <svg
      viewBox={VIEWBOX[framing]}
      preserveAspectRatio="xMidYMid slice"
      className={cn("block size-full", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {framing === "portrait" && <circle cx="100" cy="104" r="88" fill="#fff" opacity=".45" />}

      {shape.back && <path d={shape.back} fill={fill} />}

      <path d="M86 146 L86 186 C92 196 108 196 114 186 L114 146 Z" fill={shade} />
      <path d="M22 240 C26 204 62 188 100 188 C138 188 174 204 178 240 Z" fill={outfit} />
      <path d="M86 188 C92 198 108 198 114 188" fill="none" stroke="#000" strokeOpacity=".18" strokeWidth="2" />

      {!shape.hideEars && (
        <>
          <ellipse cx="60" cy="114" rx="7" ry="11" fill={shade} />
          <ellipse cx="140" cy="114" rx="7" ry="11" fill={shade} />
        </>
      )}
      <path
        d="M60 108 C60 76 78 61 100 61 C122 61 140 76 140 108 C140 137 124 160 100 160 C76 160 60 137 60 108 Z"
        fill={tone}
      />
      {fade && (
        <path
          d="M60 110 C58 82 74 62 100 62 C126 62 142 82 140 110 C136 100 132 94 126 92 C110 88 90 88 74 92 C68 94 64 100 60 110 Z"
          fill={fill}
          opacity=".35"
        />
      )}

      <g fill="none" strokeLinecap="round">
        <path d="M77 101 Q85 96 93 100 M107 100 Q115 96 123 101" stroke={DEFAULT_HAIR} strokeWidth="3" />
        <path d="M100 114 Q96 126 100 128 Q103 129 106 127" stroke={shade} strokeWidth="2.2" />
        <path d="M89 140 Q100 147 111 140" stroke="#6b3526" strokeWidth="2.6" />
      </g>
      <ellipse cx="86" cy="111" rx="3.2" ry="3.8" fill={DEFAULT_HAIR} />
      <ellipse cx="114" cy="111" rx="3.2" ry="3.8" fill={DEFAULT_HAIR} />

      <path d={shape.front} fill={fill} />
      {shape.lines && (
        <path
          d={shape.lines}
          fill="none"
          stroke="#000"
          strokeOpacity=".28"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
