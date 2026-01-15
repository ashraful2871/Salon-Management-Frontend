import OwnerRequest from "@/components/OwnerRequest/OwnerRequest";
import { salonApplications } from "@/services/become-a-salone-woner/salon-applications";

const BecomeASalonOwnerRequestPage = async () => {
  const allApplications = await salonApplications();

  return (
    <div className="p-4 md:p-6">
      <OwnerRequest applicationsResponse={allApplications} />
    </div>
  );
};

export default BecomeASalonOwnerRequestPage;
