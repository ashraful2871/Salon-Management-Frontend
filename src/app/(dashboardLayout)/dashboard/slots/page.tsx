import { SlotManagement } from "@/components/Dashboard/SlotManagement";
import { getMySalon } from "@/services/salon/getMySalon";
import { getSelectedSalonId } from "@/lib/branch-cookie";

export const metadata = {
  title: "Slot Management - Dashboard",
  description: "Manage appointment slots for your salon.",
};

export default async function SlotsPage() {
  const [mySalonRes, salonId] = await Promise.all([
    getMySalon(),
    getSelectedSalonId(),
  ]);
  const allSalons = mySalonRes?.data ?? [];
  // Slots belong to one salon: a selected branch is used directly, "All
  // branches" keeps the salon picker.
  const branch = salonId ? allSalons.filter((s) => s.id === salonId) : [];
  const mySalons = branch.length ? branch : allSalons;

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
