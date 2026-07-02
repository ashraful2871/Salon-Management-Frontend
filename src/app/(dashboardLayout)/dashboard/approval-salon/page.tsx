import ApprovalSalon from "@/components/ApprovalSalon/ApprovalSalon";
import { getAllSalon } from "@/services/salon/getAllSalon";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Approval Salon | Admin Dashboard",
  description: "Manage salon statuses and approvals",
};

export default async function ApprovalSalonPage() {
  const response = await getAllSalon();
  
  // Since the API returns { data: Salon[], meta: {...}, success: boolean }
  // We need to pass the data array to the component.
  // We will default to empty array if data is missing.
  const salons = response?.data || [];

  return (
    <div className="p-6">
      <ApprovalSalon salons={salons} />
    </div>
  );
}
