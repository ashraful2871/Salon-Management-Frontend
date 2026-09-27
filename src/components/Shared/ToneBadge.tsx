import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { TONE_CLASSES, toneOf, type Tone } from "@/lib/status-tone";

const VARIANT = {
  neutral: "secondary",
  primary: "default",
  success: "success",
  warning: "warning",
  danger: "danger",
  info: "info",
} as const satisfies Record<Tone, string>;

/** "PENDING_APPROVAL" → "Pending approval". */
export const humanizeStatus = (status: string) => {
  const s = status.replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/**
 * A soft status pill coloured by `toneOf(status)`, so the same status reads
 * the same on every page. Pass `tone` to override, `children` to relabel,
 * `dot` for a leading status dot.
 */
export function ToneBadge({
  status,
  tone,
  children,
  dot = false,
  className,
}: {
  status: string;
  tone?: Tone;
  children?: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  const resolved = tone ?? toneOf(status);
  return (
    <Badge variant={VARIANT[resolved]} className={className}>
      {dot && (
        <span
          aria-hidden="true"
          className={`size-1.5 shrink-0 rounded-full ${TONE_CLASSES[resolved].dot}`}
        />
      )}
      {children ?? humanizeStatus(status)}
    </Badge>
  );
}
