/* eslint-disable @typescript-eslint/no-explicit-any */
import ApprovalSalon from "@/components/ApprovalSalon/ApprovalSalon";
import { getAllSalon } from "@/services/salon/getAllSalon";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Approval Salon | Admin Dashboard",
  description: "Manage salon statuses and approvals",
};

export default async function ApprovalSalonPage() {
  const response = await getAllSalon();

  return (
    <div className="p-6">
      <ApprovalSalon salons={(response?.data ?? []) as any} />
    </div>
  );
}
