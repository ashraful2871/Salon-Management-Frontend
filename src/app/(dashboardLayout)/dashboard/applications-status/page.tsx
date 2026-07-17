/* eslint-disable @typescript-eslint/no-explicit-any */
import CheckStatus from "@/components/OwnerRequest/CheckStatus";
import { checkApplicationsStatus } from "@/services/become-a-salone-woner/checks-application-status";

const ApplicationsStatusPage = async () => {
  const applicationsStatus = await checkApplicationsStatus();

  return (
    <div className="p-4 md:p-6">
      <CheckStatus statusResponse={applicationsStatus as any} />
    </div>
  );
};

export default ApplicationsStatusPage;
