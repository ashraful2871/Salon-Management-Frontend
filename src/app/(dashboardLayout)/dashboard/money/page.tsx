import { redirect } from "next/navigation";

/** Only payout settings exist so far. */
export default function MoneyPage() {
  redirect("/dashboard/money/payout-settings");
}
