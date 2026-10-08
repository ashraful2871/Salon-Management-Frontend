/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next";
import ApprovalSalon from "@/components/ApprovalSalon/ApprovalSalon";
import { getAllSalon } from "@/services/salon/getAllSalon";

export const metadata: Metadata = {
  title: "Salons | Admin",
  description: "Review and manage salons",
};

// TODO(admin Phase 5): rebuilt as the salons list + approval queue on
// `/admin/salons`; until then this is the old approval screen, moved as is.
export default async function AdminSalonsPage() {
  const response = await getAllSalon();

  return (
    <div className="p-6">
      <ApprovalSalon salons={(response?.data ?? []) as any} />
    </div>
  );
}
