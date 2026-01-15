import CheckStatus from "@/components/OwnerRequest/CheckStatus";
import { checkApplicationsStatus } from "@/services/become-a-salone-woner/checks-application-status";

const ApplicationsStatusPage = async () => {
  const applicationsStatus = await checkApplicationsStatus();
  console.log(applicationsStatus);

  return (
    <div className="p-4 md:p-6">
      <CheckStatus statusResponse={applicationsStatus} />
    </div>
  );
};

export default ApplicationsStatusPage;
