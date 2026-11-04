import type { Metadata } from "next";

import SalonDetails from "@/components/Salons/SalonDetails";
import SalonViewTracker from "@/components/Salons/SalonViewTracker";
import { toSalonView } from "@/components/Salons/salon-view";
import { getSingleSalon } from "@/services/salon/getSingleSalon";
import { getSessionUser } from "@/services/auth/session";
import { getPublicSettings } from "@/services/settings/getPublicSettings";
import { bookingPaymentsEnabled } from "@/lib/deposit";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const res = await getSingleSalon(id);
  if (!res?.success || !res.data) return { title: "Salon" };
  const s = res.data;
  const where = [s.area, s.city].filter(Boolean).join(", ");
  return {
    title: where ? `${s.name}, ${where}` : s.name,
    description: (s.description || `Book ${s.name} online: services, prices, opening hours and reviews.`).slice(0, 160),
  };
}

const SalonDetailsPage = async ({ params }: Props) => {
  const { id } = await params;
  const [res, user, settings] = await Promise.all([getSingleSalon(id), getSessionUser(), getPublicSettings()]);

  // The segment's error boundary says so and offers a retry.
  if (!res?.success || !res.data) throw new Error(res?.message || "Salon not found");

  const raw = res.data;
  // Same switch the review page uses (contract 14a): off, booking is free.
  const takesDeposit =
    bookingPaymentsEnabled(settings.success ? settings.data : null) &&
    ((raw.depositMinor ?? 0) > 0 || ((raw as { depositPercent?: number | null }).depositPercent ?? 0) > 0);

  return (
    <>
      <SalonViewTracker salonId={id} />
      <SalonDetails
        salon={toSalonView(raw)}
        viewer={user ? { userId: user.userId, role: user.role } : null}
        takesDeposit={takesDeposit}
      />
    </>
  );
};

export default SalonDetailsPage;
