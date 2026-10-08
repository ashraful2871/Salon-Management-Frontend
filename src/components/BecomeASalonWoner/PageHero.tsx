import Link from "next/link";
import { Clock3, MapPin, Users } from "lucide-react";

import { Button } from "../ui/button";
import { PublicPageHero } from "../Shared/PublicPageHero";
import type { UserRole } from "@/services/auth/auth-utils";

const HIGHLIGHTS = [
  { icon: MapPin, label: "Get found nearby" },
  { icon: Clock3, label: "Faster scheduling" },
  { icon: Users, label: "Repeat customers" },
] as const;

const SIGN_IN_HREF = "/login?redirect=/become-salon-owner";

function heroActions(role?: UserRole) {
  switch (role) {
    case "SALON_OWNER":
      return (
        <Button size="lg" asChild className="w-full sm:w-auto">
          <Link href="/dashboard/store">Go to my salons</Link>
        </Button>
      );
    case "CUSTOMER":
      return (
        <Button size="lg" asChild className="w-full sm:w-auto">
          <Link href="#apply">Apply now</Link>
        </Button>
      );
    case "ADMIN":
      return (
        <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
          <Link href="/dashboard/admin/applications">
            Review owner requests
          </Link>
        </Button>
      );
    case undefined:
      return (
        <>
          <Button size="lg" asChild className="w-full sm:w-auto">
            <Link href="#apply">Apply now</Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
            <Link href={SIGN_IN_HREF}>Sign in</Link>
          </Button>
        </>
      );
    // AGENT: the owner-requests route would bounce them, and they can't apply.
    default:
      return null;
  }
}

const PageHero = ({ role }: { role?: UserRole }) => {
  const actions = heroActions(role);

  return (
    <PublicPageHero
      overline="For salon owners"
      title="Grow your salon with more bookings"
      description="Get found by customers nearby, take bookings with live slots, and run your day from one dashboard."
      actions={actions ?? undefined}
    >
      <ul className="flex flex-wrap justify-center gap-2">
        {HIGHLIGHTS.map(({ icon: Icon, label }) => (
          <li key={label}>
            <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-sm font-medium text-foreground">
              <Icon aria-hidden className="size-4 text-primary" />
              {label}
            </span>
          </li>
        ))}
      </ul>
    </PublicPageHero>
  );
};

export default PageHero;
