import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OwnerHomeData, SetupItem } from "@/services/owner/home-types";

const ITEMS: Record<SetupItem, { label: string; href: (salonId: string) => string }> = {
  services: { label: "Add services", href: () => "/dashboard/services" },
  staff: { label: "Add staff", href: (id) => `/dashboard/store/${id}?tab=staff` },
  hours: { label: "Set opening hours", href: (id) => `/dashboard/store/${id}?tab=hours` },
  slots14d: { label: "Open slots for the next 14 days", href: () => "/dashboard/slots" },
  exactPin: { label: "Place the exact map pin", href: (id) => `/dashboard/store/${id}?tab=location` },
  photos3: { label: "Add at least 3 photos", href: (id) => `/dashboard/store/${id}?tab=details` },
  payoutAccount: { label: "Verify a payout account", href: () => "/dashboard/money/payout-settings" },
  kyc: { label: "Verify your business (KYC)", href: () => "/dashboard/money/payout-settings" },
};

/** Steps only the business owner can take (money pages); a manager never sees them. */
const OWNER_ONLY = new Set<SetupItem>(["payoutAccount", "kyc"]);

/** What is left to set up, per branch. Hidden once everything is done. */
export function SetupChecklist({
  setup,
  isOwner = true,
}: {
  setup: OwnerHomeData["setup"];
  isOwner?: boolean;
}) {
  const items = isOwner ? setup.items : setup.items.filter((item) => !OWNER_ONLY.has(item));
  const left = setup.salons.some((s) => items.some((item) => !s.done[item]));
  if (setup.incompleteCount === 0 || !left) return null;
  const many = setup.salons.length > 1;

  return (
    <Card className="gap-3">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle>Finish setting up · {setup.percent}%</CardTitle>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={setup.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Setup progress"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${setup.percent}%` }} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 sm:px-6">
        {setup.salons.map((s) => (
          <div key={s.salonId}>
            {many && (
              <p className="mb-1 text-sm font-medium">
                {s.salonName} <span className="text-muted-foreground">· {s.percent}%</span>
              </p>
            )}
            <ul className="grid gap-1 sm:grid-cols-2">
              {items.map((item) => {
                const { label, href } = ITEMS[item];
                return (
                  <li key={item}>
                    {s.done[item] ? (
                      <span className="flex min-h-9 items-center gap-2 text-sm text-muted-foreground line-through">
                        <Check aria-hidden="true" className="size-4 text-success" />
                        {label}
                      </span>
                    ) : (
                      <Link
                        href={href(s.salonId)}
                        className="flex min-h-9 items-center gap-2 rounded-lg text-sm font-medium hover:text-primary"
                      >
                        <Circle aria-hidden="true" className="size-4 text-muted-foreground" />
                        {label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {setup.incompleteCount > setup.salons.length && (
          <p className="text-xs text-muted-foreground">
            And {setup.incompleteCount - setup.salons.length} more branches with steps left.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
