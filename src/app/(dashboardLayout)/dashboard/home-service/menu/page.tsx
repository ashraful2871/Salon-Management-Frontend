import { MenuPanel } from "@/components/HomeService/owner/MenuPanel";
import { OwnerHomeFrame } from "@/components/HomeService/owner/OwnerHomeFrame";
import { EmptyState } from "@/components/Shared/EmptyState";
import { getHomeOfferings } from "@/services/home-service/getHomeOfferings";
import type { HomeAudience, OwnerHomeProfile } from "@/services/home-service/types";

export const metadata = { title: "Home menu" };

async function Menu({ home, side }: { home: OwnerHomeProfile; side?: HomeAudience }) {
  const res = await getHomeOfferings(home.salon.id);
  if (!res.success || !res.data) {
    return <EmptyState title="We couldn't load the menu" description={res.message} />;
  }
  return <MenuPanel salonId={home.salon.id} offerings={res.data} sides={home.allowedSides} initialSide={side} />;
}

/** /dashboard/home-service/menu: the Ladies and Gents home menus (`?side=` from the checklist). */
export default async function HomeMenuPage({ searchParams }: { searchParams: Promise<{ side?: string }> }) {
  const { side } = await searchParams;
  const initial = side === "LADIES" || side === "GENTS" ? side : undefined;
  return <OwnerHomeFrame tab="menu">{(home) => <Menu home={home} side={initial} />}</OwnerHomeFrame>;
}
