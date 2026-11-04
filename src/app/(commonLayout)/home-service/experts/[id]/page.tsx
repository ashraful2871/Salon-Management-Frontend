import { redirect } from "next/navigation";

import { getHomeExpert } from "@/services/home-service/getHomeExpert";

/**
 * Home visits are booked only from a salon's page, so an expert link (old
 * bookmarks, emails) opens the expert's salon, whose "At home" option has the
 * same menu. The profile itself (components/HomeService/ExpertProfile) is kept.
 */
export default async function HomeExpertRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getHomeExpert(id);
  redirect(res.success && res.data ? `/salons/${res.data.salon.id}` : "/home-service");
}
