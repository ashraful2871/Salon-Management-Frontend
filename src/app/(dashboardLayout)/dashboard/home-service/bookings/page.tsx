import { BookingsBoard, type BoardFilters } from "@/components/HomeService/owner/BookingsBoard";
import { OwnerHomeFrame } from "@/components/HomeService/owner/OwnerHomeFrame";
import { EmptyState } from "@/components/Shared/EmptyState";
import { getOwnerHomeBookings } from "@/services/home-service/getOwnerHomeBookings";
import { getOwnerHomeExperts } from "@/services/home-service/getOwnerHomeExperts";
import type { HomeAudience, HomeBookingStatus, OwnerHomeProfile } from "@/services/home-service/types";
import { HOME_STATUS_LABEL } from "@/components/HomeService/booking/format";

export const metadata = { title: "Home visits" };

const PAGE_SIZE = 20;

type SearchParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const filtersFrom = (sp: SearchParams): BoardFilters => {
  const tab = one(sp.tab);
  const audience = one(sp.audience);
  const status = one(sp.status);
  return {
    tab: tab === "upcoming" || tab === "past" ? tab : "today",
    audience: audience === "LADIES" || audience === "GENTS" ? (audience as HomeAudience) : undefined,
    expertId: one(sp.expertId),
    status: status && status in HOME_STATUS_LABEL ? (status as HomeBookingStatus) : undefined,
  };
};

async function Board({ home, filters, page }: { home: OwnerHomeProfile; filters: BoardFilters; page: number }) {
  const salonId = home.salon.id;
  const [res, experts] = await Promise.all([
    getOwnerHomeBookings({ salonId, ...filters, page }),
    getOwnerHomeExperts(salonId),
  ]);
  if (!res.success || !res.data) {
    return <EmptyState title="We couldn't load the visits" description={res.message} />;
  }
  const total = res.meta?.total ?? res.data.length;
  return (
    <BookingsBoard
      salonId={salonId}
      bookings={res.data}
      filters={filters}
      page={page}
      total={total}
      pageSize={res.meta?.limit ?? PAGE_SIZE}
      totalPages={Math.ceil(total / (res.meta?.limit ?? PAGE_SIZE))}
      heldMinor={res.meta?.heldMinor ?? 0}
      experts={experts.data ?? []}
      sides={home.allowedSides}
      showMoneyLink={home.canSwitch}
      creditMinor={home.policy.salonCancelCreditMinor}
    />
  );
}

/** /dashboard/home-service/bookings: the board. Email links add `?salonId=`. */
export default async function HomeBookingsBoardPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(one(sp.page)) || 1);
  return (
    <OwnerHomeFrame tab="bookings" wanted={one(sp.salonId)}>
      {(home) => <Board home={home} filters={filtersFrom(sp)} page={page} />}
    </OwnerHomeFrame>
  );
}
