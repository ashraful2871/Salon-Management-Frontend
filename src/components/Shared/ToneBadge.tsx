import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { toneOf, type Tone } from "@/lib/status-tone";

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
 * the same on every page. Pass `tone` to override, `children` to relabel.
 */
export function ToneBadge({
  status,
  tone,
  children,
  className,
}: {
  status: string;
  tone?: Tone;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Badge variant={VARIANT[tone ?? toneOf(status)]} className={className}>
      {children ?? humanizeStatus(status)}
    </Badge>
  );
}
