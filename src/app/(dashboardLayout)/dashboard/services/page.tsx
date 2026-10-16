/* eslint-disable @typescript-eslint/no-explicit-any */
import Services from "@/components/Dashboard/Services";
import { getMySalon } from "@/services/salon/getMySalon";
import { getMyServices } from "@/services/service/getMyServices";
import { getSelectedSalonId } from "@/lib/branch-cookie";
import { getMyAccess } from "@/services/owner/getMyAccess";
import { canAt } from "@/lib/owner-access";

const ServicesPage = async () => {
  const salonId = await getSelectedSalonId();
  const [allSalons, servicesResponse, access] = await Promise.all([
    getMySalon(),
    getMyServices(salonId),
    getMyAccess(),
  ]);
  // A manager edits names and prices only where the owner allowed it.
  const canEdit = !access.success || canAt(access, "services.edit", salonId);
  // One branch selected: the page (and the add form) work on it alone. On
  // "All branches" the add form keeps its salon picker.
  const branch = salonId
    ? (allSalons.data ?? []).filter((s: { id: string }) => s.id === salonId)
    : [];
  const salonsResponse = branch.length ? { ...allSalons, data: branch } : allSalons;

  return (
    <div className="p-4 md:p-6">
      <Services
        salonsResponse={salonsResponse as any}
        servicesResponse={servicesResponse as any}
        canEdit={canEdit}
      />
    </div>
  );
};

export default ServicesPage;
