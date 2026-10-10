/* eslint-disable @typescript-eslint/no-explicit-any */
import SalonDetails from "@/components/Salons/SalonDetails";
import { getSingleSalon } from "@/services/salon/getSingleSalon";
import { getSessionUser } from "@/services/auth/session";
import SalonViewTracker from "@/components/Salons/SalonViewTracker";

const SalonDetailsPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const [res, user] = await Promise.all([getSingleSalon(id), getSessionUser()]);
  return (
    <>
      {res?.success && res.data && <SalonViewTracker salonId={id} />}
      <SalonDetails
        salon={res?.data as any}
        viewer={user ? { userId: user.userId, role: user.role } : null}
      />
    </>
  );
};

export default SalonDetailsPage;
