import { OfferCard } from "@/components/HomeService/owner/OfferCard";
import { OwnerHomeFrame } from "@/components/HomeService/owner/OwnerHomeFrame";
import { SetupPanel } from "@/components/HomeService/owner/SetupPanel";
import { getOwnerHomeBookings } from "@/services/home-service/getOwnerHomeBookings";
import type { OwnerHomeProfile } from "@/services/home-service/types";

export const metadata = { title: "Home Service" };

async function Setup({ home }: { home: OwnerHomeProfile }) {
  if (!home.profile.exists) return <OfferCard home={home} />;

  // What "turn off" would ask about, fresh: the page is the only read of it.
  const confirmed = await getOwnerHomeBookings({ salonId: home.salon.id, status: "CONFIRMED" });
  return <SetupPanel home={home} upcoming={confirmed.meta?.total ?? 0} />;
}

/** /dashboard/home-service: the opt-in card, or the branch's status and switch. */
export default function HomeServicePage() {
  return <OwnerHomeFrame tab="setup">{(home) => <Setup home={home} />}</OwnerHomeFrame>;
}
