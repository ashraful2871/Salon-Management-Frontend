/* eslint-disable @typescript-eslint/no-explicit-any */
import Services from "@/components/Dashboard/Services";
import { getMySalon } from "@/services/salon/getMySalon";
import { getMyServices } from "@/services/service/getMyServices";
import { getSelectedSalonId } from "@/lib/branch-cookie";

const ServicesPage = async () => {
  const salonId = await getSelectedSalonId();
  const [allSalons, servicesResponse] = await Promise.all([
    getMySalon(),
    getMyServices(salonId),
  ]);
  // One branch selected: the page (and the add form) work on it alone. On
  // "All branches" the add form keeps its salon picker.
  const branch = salonId
    ? (allSalons.data ?? []).filter((s: { id: string }) => s.id === salonId)
    : [];
  const salonsResponse = branch.length ? { ...allSalons, data: branch } : allSalons;

  return (
    <div className="p-4 md:p-6">
      <Services salonsResponse={salonsResponse as any} servicesResponse={servicesResponse as any} />
    </div>
  );
};

export default ServicesPage;
