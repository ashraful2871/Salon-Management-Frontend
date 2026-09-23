"use client";

import type { ReactNode } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  RefreshCw,
  RotateCcw,
  Scissors,
  Star,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

// The API sends an icon *name*, never markup. An unknown name renders no icon
// rather than a broken one, so a new name from the server is harmless.
const ICONS: Record<string, LucideIcon> = {
  "map-pin": MapPin,
  scissors: Scissors,
  wallet: Wallet,
  calendar: CalendarDays,
  clock: Clock,
  phone: Phone,
  star: Star,
  restart: RotateCcw,
  back: ArrowLeft,
  refresh: RefreshCw,
};

type ChipProps = {
  label?: string;
  icon?: string;
  style?: "primary" | "ghost";
  /** The option this chip's row settled on; marks it `aria-pressed`. */
  selected?: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  title?: string;
  children?: ReactNode;
};

/**
 * Every tappable thing in the transcript is one of these: a real `<button>`, at
 * least 44 px tall, wrapping rather than truncating mid-word.
 */
const Chip = ({
  label,
  icon,
  style = "ghost",
  selected = false,
  disabled = false,
  onClick,
  className,
  title,
  children,
}: ChipProps) => {
  const Icon = icon ? ICONS[icon] : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      title={title}
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        style === "primary"
          ? "border-transparent bg-primary text-primary-foreground hover:bg-primary/90"
          : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5",
        selected && style !== "primary" && "border-primary/60 bg-primary/10",
        className,
      )}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden />}
      {children ?? <span className="text-left">{label}</span>}
    </button>
  );
};

export default Chip;
