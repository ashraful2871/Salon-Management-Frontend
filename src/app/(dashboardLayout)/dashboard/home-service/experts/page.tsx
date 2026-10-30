import { ExpertsPanel } from "@/components/HomeService/owner/ExpertsPanel";
import { OwnerHomeFrame } from "@/components/HomeService/owner/OwnerHomeFrame";
import { EmptyState } from "@/components/Shared/EmptyState";
import { getHomeExpertCandidates } from "@/services/home-service/getHomeExpertCandidates";
import { getHomeOfferings } from "@/services/home-service/getHomeOfferings";
import { getOwnerHomeExperts } from "@/services/home-service/getOwnerHomeExperts";
import type { OwnerHomeProfile } from "@/services/home-service/types";

export const metadata = { title: "Home experts" };

async function Experts({ home }: { home: OwnerHomeProfile }) {
  const salonId = home.salon.id;
  const [experts, candidates, offerings] = await Promise.all([
    getOwnerHomeExperts(salonId),
    getHomeExpertCandidates(salonId),
    getHomeOfferings(salonId),
  ]);
  if (!experts.success || !experts.data) {
    return <EmptyState title="We couldn't load the experts" description={experts.message} />;
  }
  return (
    <ExpertsPanel
      salonId={salonId}
      experts={experts.data}
      candidates={candidates.data ?? []}
      offerings={offerings.data ?? []}
      sides={home.allowedSides}
    />
  );
}

/** /dashboard/home-service/experts: staff set up for home visits, and their verification. */
export default function HomeExpertsPage() {
  return <OwnerHomeFrame tab="experts">{(home) => <Experts home={home} />}</OwnerHomeFrame>;
}
