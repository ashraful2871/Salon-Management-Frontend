import { redirect } from "next/navigation";

/** The nav group has no page of its own: its first queue. */
export default function AdminHomeServicePage() {
  redirect("/dashboard/admin/home-service/approvals");
}
