import { redirect } from "next/navigation";

/** Earnings moved into the Money hub. */
export default function EarningsPage() {
  redirect("/dashboard/money");
}
