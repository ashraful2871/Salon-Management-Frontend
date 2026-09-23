"use client";

import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Block } from "@/lib/assistant-types";
import { formatDuration } from "../format";
import type { BlockProps } from "../block-props";

type ServicePickerBlock = Extract<Block, { type: "service_picker" }>;

/** Rows, not chips: a service carries a price, a length and a deposit, and
 *  three numbers do not fit in a pill on a 360 px screen. */
const ServicePicker = ({
  block,
  disabled,
  chosen,
  onAction,
}: BlockProps<ServicePickerBlock>) => {
  const services = block.services ?? [];
  if (services.length === 0) return null;

  return (
    <ul className="space-y-2">
      {services.map((service) => {
        const selected = chosen === service.name;

        return (
          <li key={service.id}>
            <button
              type="button"
              onClick={() =>
                onAction(
                  { type: "choose_service", serviceId: service.id },
                  service.name,
                )
              }
              disabled={disabled}
              aria-pressed={selected}
              className={cn(
                "flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left",
                "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                "disabled:cursor-not-allowed disabled:opacity-50",
                selected
                  ? "border-primary/60 bg-primary/10"
                  : "border-border bg-background hover:border-primary/50 hover:bg-primary/5",
              )}
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">
                  {service.name}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {[
                    formatDuration(service.duration),
                    service.category?.replaceAll("_", " ").toLowerCase(),
                    `${service.slotCount} free`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>

              <span className="shrink-0 text-right">
                <span className="block text-sm font-bold text-foreground">
                  {formatBDT(service.priceMinor)}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {formatBDT(service.depositMinor)} deposit
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default ServicePicker;
