import type { ReactNode } from "react";
import { UserRoundX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOutTo } from "@/services/auth/signOutTo";
import { cn } from "@/lib/utils";

const ROLE_NOUN: Record<string, string> = {
  STAFF: "a stylist",
  SALON_OWNER: "a salon owner",
  BRANCH_MANAGER: "a branch manager",
  ADMIN: "an admin",
  AGENT: "an agent",
};

/**
 * Only customer accounts book (the API answers anything else with
 * `CUSTOMER_ONLY`). Shown instead of the booking flow to a signed-in
 * owner, stylist, manager, admin or agent, with the way to switch accounts and
 * come back to `returnTo`.
 */
export default function CustomerOnlyNotice({
  role,
  returnTo,
  secondary,
  inDialog = false,
  className,
}: {
  /** Inside a dialog that already carries the title: text and actions only. */
  inDialog?: boolean;
  role: string;
  /** Where "Switch to a customer account" lands after signing in again. */
  returnTo: string;
  /** The other way out, e.g. "Back to the salon" or a Close button. */
  secondary?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(inDialog ? "text-left" : "text-center", className)}>
      {!inDialog && (
        <>
          <div
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-warning-soft text-warning"
            aria-hidden
          >
            <UserRoundX className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-semibold text-charcoal">
            Only customer accounts can book
          </h2>
        </>
      )}
      <p
        className={cn(
          "text-sm leading-relaxed text-muted-foreground",
          !inDialog && "mx-auto mt-2 max-w-sm"
        )}
      >
        You&apos;re signed in as {ROLE_NOUN[role] ?? "a non-customer account"}.
        Appointments are booked from a customer account, which pays the deposit
        from its own wallet. Sign in with a customer account to book.
      </p>
      <div
        className={cn(
          "mt-6 flex flex-col-reverse gap-2 sm:flex-row",
          inDialog ? "sm:justify-end" : "justify-center"
        )}
      >
        {secondary}
        <form action={signOutTo}>
          <input type="hidden" name="returnTo" value={returnTo} />
          <Button type="submit" className="w-full sm:w-auto">
            Switch to a customer account
          </Button>
        </form>
      </div>
    </div>
  );
}
