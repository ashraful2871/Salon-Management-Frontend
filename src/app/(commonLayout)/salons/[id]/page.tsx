import type { Metadata } from "next";

import SalonDetails from "@/components/Salons/SalonDetails";
import SalonViewTracker from "@/components/Salons/SalonViewTracker";
import { toSalonView } from "@/components/Salons/salon-view";
import { getSingleSalon } from "@/services/salon/getSingleSalon";
import { getSessionUser } from "@/services/auth/session";
import { getPublicSettings, referralSettingsOf } from "@/services/settings/getPublicSettings";
import { getMyRewards } from "@/services/referral/getMyRewards";
import { bookingPaymentsEnabled } from "@/lib/deposit";
import { percentLabel } from "@/lib/referral-terms";
import { bestSalonReward } from "@/lib/referral-view";

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
  const session = getSessionUser();
  const [res, user, settings, rewards] = await Promise.all([
    getSingleSalon(id),
    session,
    getPublicSettings(),
    // A signed-in customer's usable rewards, for the "applies at checkout" hint (cached under myRewards).
    session.then((u) => (u?.role === "CUSTOMER" ? getMyRewards("AVAILABLE", 1) : null)),
  ]);

  // The segment's error boundary says so and offers a retry.
  if (!res?.success || !res.data) throw new Error(res?.message || "Salon not found");

  const raw = res.data;
  // Same switch the review page uses (contract 14a): off, booking is free.
  const takesDeposit =
    bookingPaymentsEnabled(settings.success ? settings.data : null) &&
    ((raw.depositMinor ?? 0) > 0 || ((raw as { depositPercent?: number | null }).depositPercent ?? 0) > 0);
  // Only while redemptions are on; the quote at checkout still decides the amount.
  const reward =
    rewards?.success && referralSettingsOf(settings.success ? settings.data : null)["referral.redemptionsEnabled"]
      ? bestSalonReward(rewards.data ?? [], new Date())
      : null;

  return (
    <>
      <SalonViewTracker salonId={id} />
      <SalonDetails
        salon={toSalonView(raw)}
        viewer={user ? { userId: user.userId, role: user.role } : null}
        takesDeposit={takesDeposit}
        rewardHint={reward ? `Your ${percentLabel(reward.percent)} reward applies at checkout` : null}
      />
    </>
  );
};

export default SalonDetailsPage;
