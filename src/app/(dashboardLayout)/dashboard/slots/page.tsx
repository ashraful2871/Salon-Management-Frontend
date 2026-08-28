import { SlotManagement } from "@/components/Dashboard/SlotManagement";
import { getMySalon } from "@/services/salon/getMySalon";
import { getUserRoles } from "@/services/get-roles/getUserRoles";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Slot Management - Dashboard",
  description: "Manage appointment slots for your salon.",
};

export default async function SlotsPage() {
  const userRole = await getUserRoles();

  if (userRole !== "SALON_OWNER") {
    redirect("/");
  }

  const mySalonRes = await getMySalon();
  const mySalons = mySalonRes?.data ?? [];

  if (mySalons.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-destructive">No Salon Found</h2>
        <p className="text-muted-foreground mt-2">
          You must create a salon before managing slots.
        </p>
      </div>
    );
  }

  return <SlotManagement salons={mySalons} />;
}
