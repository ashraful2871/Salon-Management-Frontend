import Services from "@/components/Dashboard/Services";
import React from "react";
import { getMySalon } from "@/services/salon/getMySalon";
import { getAllServices } from "@/services/service/getAllServices";

const ServicesPage = async () => {
  const salonsResponse = await getMySalon();
  const servicesResponse = await getAllServices();

  return (
    <div className="p-4 md:p-6">
      <Services salonsResponse={salonsResponse} servicesResponse={servicesResponse} />
    </div>
  );
};

export default ServicesPage;
