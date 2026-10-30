import { EmptyState } from "@/components/Shared/EmptyState";
import { PageHeader } from "@/components/Shared/PageHeader";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import AddressesPanel from "@/components/HomeService/dashboard/AddressesPanel";
import { HomeBookingTabs, type HomeBookingsTab } from "@/components/HomeService/dashboard/HomeBookingTabs";
import HomeBookingsList from "@/components/HomeService/dashboard/HomeBookingsList";
import { FilterNavigationProvider } from "@/hooks/useFilterNavigation";
import { getHomeAddresses } from "@/services/home-service/getHomeAddresses";
import { getMyHomeBookings } from "@/services/home-service/getMyHomeBookings";
import { getMyWallet } from "@/services/wallet/getMyWallet";

export const metadata = { title: "Home bookings" };

type SearchParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const tabOf = (v?: string): HomeBookingsTab => (v === "past" || v === "addresses" ? v : "upcoming");

async function Addresses() {
  const res = await getHomeAddresses();
  if (!res.success) return <EmptyState title="We couldn't load your addresses" description={res.message} />;
  return <AddressesPanel addresses={res.data ?? []} />;
}

async function Visits({ tab, page }: { tab: "upcoming" | "past"; page: number }) {
  const [res, wallet] = await Promise.all([getMyHomeBookings(tab, page), getMyWallet()]);
  if (!res.success) return <EmptyState title="We couldn't load your visits" description={res.message} />;
  const total = res.meta?.total ?? 0;
  const pageSize = res.meta?.limit ?? 20;
  return (
    <HomeBookingsList
      bookings={res.data ?? []}
      tab={tab}
      page={page}
      total={total}
      pageSize={pageSize}
      totalPages={Math.max(1, Math.ceil(total / pageSize))}
      walletMinor={wallet.success && wallet.data ? wallet.data.availableMinor : 0}
    />
  );
}

/** /dashboard/home-bookings: the customer's home visits and saved addresses. */
export default async function HomeBookingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const tab = tabOf(one(sp.tab));
  const page = Math.max(1, Number(one(sp.page)) || 1);

  return (
    <FilterNavigationProvider>
      <PageHeader title="Home bookings" description="Your home visits and saved addresses." />
      <div className="space-y-5">
        <HomeBookingTabs current={tab} />
        <PendingRegion>{tab === "addresses" ? <Addresses /> : <Visits tab={tab} page={page} />}</PendingRegion>
      </div>
    </FilterNavigationProvider>
  );
}
