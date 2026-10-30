import { OwnerHomeFrame } from "@/components/HomeService/owner/OwnerHomeFrame";
import { PolicyPanel } from "@/components/HomeService/owner/PolicyPanel";

export const metadata = { title: "Home Service policy" };

/** /dashboard/home-service/policy: the cancellation policy and commission in force. */
export default function HomePolicyPage() {
  return <OwnerHomeFrame tab="policy">{(home) => <PolicyPanel home={home} />}</OwnerHomeFrame>;
}
