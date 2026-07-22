/* eslint-disable @typescript-eslint/no-explicit-any */
import Services from "@/components/Dashboard/Services";
import { getMySalon } from "@/services/salon/getMySalon";
import { getMyServices } from "@/services/service/getMyServices";

const ServicesPage = async () => {
  const salonsResponse = await getMySalon();
  const servicesResponse = await getMyServices();

  return (
    <div className="p-4 md:p-6">
      <Services salonsResponse={salonsResponse as any} servicesResponse={servicesResponse as any} />
    </div>
  );
};

export default ServicesPage;
