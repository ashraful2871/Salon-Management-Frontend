"use client";

import Link from "next/link";
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Navigation,
  ShieldCheck,
} from "lucide-react";

import CopyButton from "@/components/Wallet/CopyButton";
import { formatBDT } from "@/lib/money";
import type { Block } from "@/lib/assistant-types";
import { formatDhakaClock, formatTime, formatYmd } from "../format";

type ConfirmedBlock = Extract<Block, { type: "booking_confirmed" }>;

/**
 * `.ics` built in the browser rather than fetched: the whole event is already
 * on this card, so a data URL is the entire feature. Times are the salon's wall
 * clock with no zone, which is what a floating VEVENT means — the right answer
 * for an appointment you attend in person.
 */
const calendarHref = (block: ConfirmedBlock): string => {
  const stamp = (time: string) =>
    `${block.date.replace(/-/g, "")}T${time.replace(":", "")}00`;

  const escape = (value: string) =>
    value.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SalonKhuji//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${block.appointmentId}@salonkhuji`,
    `DTSTART:${stamp(block.startTime)}`,
    `DTEND:${stamp(block.endTime ?? block.startTime)}`,
    `SUMMARY:${escape(`${block.serviceName} at ${block.salonName}`)}`,
    `LOCATION:${escape(block.salonAddress)}`,
    `DESCRIPTION:${escape(
      [
        block.token ? `Token ${block.token}` : "",
        block.serialNumber ? `Serial #${block.serialNumber}` : "",
        block.dueAtSalonMinor > 0
          ? `Pay ${formatBDT(block.dueAtSalonMinor)} at the salon`
          : "Nothing left to pay at the salon",
      ]
        .filter(Boolean)
        .join(" · "),
    )}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
};

const Action = ({
  href,
  icon: Icon,
  label,
  download,
  external,
}: {
  href: string;
  icon: typeof MapPin;
  label: string;
  download?: string;
  external?: boolean;
}) => (
  <a
    href={href}
    {...(download ? { download } : {})}
    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
  >
    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
    {label}
  </a>
);

/**
 * The booking, made. Deliberately the same wording as
 * `Salons/BookingConfirmed.tsx` — a customer who books in the chat and then
 * opens the website should not have to work out whether they are looking at
 * the same thing.
 */
const BookingConfirmedCard = ({ block }: { block: ConfirmedBlock }) => (
  <div className="overflow-hidden rounded-xl border border-sage/40 bg-background">
    <div className="flex items-center gap-2 border-b border-border bg-sage/10 px-3.5 py-2.5">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-sage" aria-hidden />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
        Your appointment is booked
      </p>
    </div>

    <div className="space-y-3 p-3.5">
      <div className="rounded-lg border border-dashed border-primary/40 bg-muted/40 px-3 py-3 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Show this at the counter
        </p>

        {block.token && (
          <div className="mt-2 flex items-center justify-center gap-1.5">
            <span className="break-all font-mono text-xl font-bold tracking-wider text-foreground">
              {block.token}
            </span>
            <CopyButton value={block.token} label="Token" />
          </div>
        )}

        {block.serialNumber !== null && (
          <p className="mt-1 font-serif text-base font-bold tabular-nums text-primary">
            Serial #{block.serialNumber}
          </p>
        )}
      </div>

      <ul className="space-y-2 text-sm">
        <li className="flex items-start gap-2.5">
          <CalendarDays
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <span className="min-w-0">
            <span className="font-semibold">{formatYmd(block.date)}</span>
            <span className="block text-xs text-muted-foreground">
              {formatTime(block.startTime)}
              {block.endTime ? ` – ${formatTime(block.endTime)}` : ""}
              {block.counterName ? ` · ${block.counterName}` : ""}
              {block.staffName ? ` · ${block.staffName}` : ""}
            </span>
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <MapPin
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <span className="min-w-0">
            <span className="font-semibold">{block.salonName}</span>
            <span className="block text-xs text-muted-foreground">
              {block.serviceName} · {block.salonAddress}
            </span>
          </span>
        </li>
      </ul>

      <p className="rounded-lg bg-muted/50 px-3 py-2.5 text-sm font-semibold text-foreground">
        {block.dueAtSalonMinor > 0 ? (
          <>
            Pay {formatBDT(block.dueAtSalonMinor)} at the salon
            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
              {formatBDT(block.depositMinor)} of {formatBDT(block.totalMinor)} is
              held from your wallet.
            </span>
          </>
        ) : (
          <>
            Nothing more to pay at the salon
            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
              {formatBDT(block.depositMinor)} is held from your wallet.
            </span>
          </>
        )}
      </p>

      {block.freeCancellationUntil && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage" aria-hidden />
          The deposit is held, not spent. Free cancellation until{" "}
          {formatDhakaClock(block.freeCancellationUntil)} — after that the salon
          keeps a slice of it.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {block.mapUrl && (
          <Action
            href={block.mapUrl}
            icon={Navigation}
            label="Directions"
            external
          />
        )}
        <Action
          href={calendarHref(block)}
          icon={CalendarPlus}
          label="Add to calendar"
          download={`${block.salonName.replace(/[^\w-]+/g, "-")}-${block.date}.ics`}
        />
        <Link
          href={block.manageUrl}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Manage booking
        </Link>
      </div>
    </div>
  </div>
);

export default BookingConfirmedCard;
