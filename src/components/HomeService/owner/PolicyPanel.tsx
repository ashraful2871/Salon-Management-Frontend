import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { policyShortLine } from "@/lib/home-policy";
import { formatBDT } from "@/lib/money";
import { SITE } from "@/lib/site";
import type { OwnerHomeProfile } from "@/services/home-service/types";

/** Read-only: what customers agree to and what the platform takes. */
export function PolicyPanel({ home }: { home: OwnerHomeProfile }) {
  const { policy, policyInForce, platform } = home;
  const rows: [string, string][] = [
    ["Advance", `${policyInForce.advancePercent}% of the visit`],
    ["Commission", `${platform.commissionPercent}%${platform.commissionPercent === 0 ? " at launch" : ""}`],
    ["No-show", policy.noShowPercent > 0 ? `${policy.noShowPercent}% kept` : "Nothing kept"],
    ["Reschedule", policy.maxRescheduleCount === 1 ? "Once" : `Up to ${policy.maxRescheduleCount} times`],
  ];
  if (policy.policy === "WINDOW") {
    rows.splice(1, 0, ["Late cancel", `${policy.lateCancelPercent}% kept within ${policy.freeCancelHours} h of the visit`]);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{policyShortLine(policy)}</CardTitle>
          <CardDescription>The cancellation policy in force for new bookings.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-border text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What customers read before paying</CardTitle>
          <CardDescription>Shown here for a {formatBDT(policy.sampleAdvanceMinor)} advance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <blockquote className="rounded-xl bg-muted p-3 text-sm">{policy.disclaimer.en}</blockquote>
          <blockquote lang="bn" className="rounded-xl bg-muted p-3 text-sm">
            {policy.disclaimer.bn}
          </blockquote>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">Set by {SITE.name}.</p>
    </div>
  );
}
