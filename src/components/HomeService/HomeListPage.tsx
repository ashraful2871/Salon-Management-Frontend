import Link from "next/link";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { MapPinOff, SearchX } from "lucide-react";

import { Overline } from "@/components/LadiesParlour/Heading";
import { EmptyState } from "@/components/Shared/EmptyState";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import { PublicPageHero } from "@/components/Shared/PublicPageHero";
import { Button } from "@/components/ui/button";
import { FilterNavigationProvider } from "@/hooks/useFilterNavigation";
import { isInBangladesh, roundCoord } from "@/lib/geo";
import { LOCATION_COOKIE, parseSavedLocation } from "@/lib/location-cookie";
import { getHomeCatalog } from "@/services/home-service/getHomeCatalog";
import { getHomeExperts } from "@/services/home-service/getHomeExperts";
import type { HomeAudience, HomeCategory, HomeExpertSort } from "@/services/home-service/types";
import { getPublicSettings, homeSettingsOf } from "@/services/settings/getPublicSettings";
import { CATEGORY_LABEL, SIDES, SORT_LABEL, isHomeCategory, policyLineOf, sideEnabled, trackSide } from "./content";
import { ChipsSkeleton, ExpertCard, HOME_GRID, HomeGridSkeleton, OfferingCard } from "./HomeCards";
import {
  ChangeLocationButton,
  HomeCategoryChips,
  HomeLocationBar,
  HomePagination,
  HomeViewControls,
  type HomeView,
} from "./HomeListControls";
import { HomeTrack } from "./HomeTrack";

const PAGE_SIZE = 20;

type Point = { lat: number; lng: number };
type Params = { [key: string]: string | undefined };

const toNumber = (v?: string) => (v == null || v.trim() === "" ? NaN : Number(v));

const COPY: Record<HomeAudience, { title: string; description: string }> = {
  LADIES: {
    title: "Female beauty experts at your home",
    description: "Every Ladies at Home expert is a woman, ID-verified by our team, from a salon near you.",
  },
  GENTS: {
    title: "Grooming experts at your home",
    description: "Haircut, beard and grooming by verified male experts from salons near you.",
  },
};

/**
 * /home-service/ladies and /home-service/gents: the services and experts that
 * reach a point, pinned to one side. The point, view, category, sort and page
 * all live in the URL; a new location from the dialog restarts the list at it
 * (lib/salon-list-paths). The header and controls paint at once; only the
 * chips and the grid wait for the API.
 */
export default async function HomeListPage({ searchParams, audience }: { searchParams: Params; audience: HomeAudience }) {
  const [jar, settingsRes] = await Promise.all([cookies(), getPublicSettings()]);
  const settings = homeSettingsOf(settingsRes.success ? settingsRes.data : null);
  const saved = parseSavedLocation(jar.get(LOCATION_COOKIE)?.value);

  const urlLat = toNumber(searchParams.lat);
  const urlLng = toNumber(searchParams.lng);
  let point: Point | null = null;
  let label: string | null = null;
  if (isInBangladesh(urlLat, urlLng)) {
    point = { lat: roundCoord(urlLat), lng: roundCoord(urlLng) };
    label = saved && saved.lat === point.lat && saved.lng === point.lng ? saved.label : "the pinned location";
  } else if (saved) {
    point = { lat: saved.lat, lng: saved.lng };
    label = saved.label;
  }

  const view: HomeView = searchParams.view === "expert" ? "expert" : "service";
  const category = isHomeCategory(searchParams.category) ? searchParams.category : undefined;
  const sort = (Object.keys(SORT_LABEL) as HomeExpertSort[]).find((s) => s === searchParams.sort) ?? "rating";
  const requestedPage = Math.floor(toNumber(searchParams.page));
  const page = requestedPage > 1 ? requestedPage : 1;
  const open = sideEnabled(settings, audience);

  return (
    <FilterNavigationProvider>
      <HomeTrack event="home_view" dim={trackSide(audience)} />
      <ListHeader audience={audience} />

      <section aria-label={SIDES[audience].title} className="py-6 md:py-10">
        <div className="container mx-auto space-y-5 px-4 sm:px-6 lg:px-8">
          {!open ? (
            <SideClosed audience={audience} />
          ) : (
            <>
              <HomeLocationBar label={label} autoOpen={!point} />
              {point ? (
                <>
                  <div className="space-y-4 rounded-3xl border border-border bg-surface p-3 shadow-soft sm:p-4">
                    <HomeViewControls view={view} sort={sort} />
                    <Suspense fallback={<ChipsSkeleton />}>
                      <ChipsLoader audience={audience} point={point} category={category} view={view} />
                    </Suspense>
                  </div>
                  <PendingRegion className="pt-2">
                    <Suspense fallback={<HomeGridSkeleton />}>
                      {view === "service" ? (
                        <ServiceResults
                          audience={audience}
                          point={point}
                          place={label}
                          category={category}
                          searchParams={searchParams}
                        />
                      ) : (
                        <ExpertResults
                          audience={audience}
                          point={point}
                          place={label}
                          category={category}
                          sort={sort}
                          page={page}
                          policyLine={policyLineOf(settings)}
                        />
                      )}
                    </Suspense>
                  </PendingRegion>
                </>
              ) : (
                <EmptyState
                  icon={MapPinOff}
                  title="Where should the expert come?"
                  description="Set your location to see the services and experts that reach you."
                  action={<ChangeLocationButton>Set location</ChangeLocationButton>}
                />
              )}
            </>
          )}
        </div>
      </section>
    </FilterNavigationProvider>
  );
}

/** Ladies in the brand's gold and charcoal; Gents on the default hero. */
function ListHeader({ audience }: { audience: HomeAudience }) {
  const copy = COPY[audience];
  if (audience === "GENTS") {
    return (
      <PublicPageHero
        size="compact"
        align="left"
        overline={SIDES.GENTS.title}
        title={copy.title}
        description={copy.description}
      />
    );
  }
  return (
    <section className="border-b border-gold/20 bg-background bg-glow-gold">
      <div className="container mx-auto px-4 py-8 text-center sm:px-6 md:py-10 lg:px-8 lg:text-left">
        <Overline align="responsive">{SIDES.LADIES.title}</Overline>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-balance text-foreground md:text-4xl">
          {copy.title}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg lg:mx-0">{copy.description}</p>
      </div>
    </section>
  );
}

function SideClosed({ audience }: { audience: HomeAudience }) {
  const other: HomeAudience = audience === "LADIES" ? "GENTS" : "LADIES";
  return (
    <EmptyState
      icon={SearchX}
      title={`${SIDES[audience].title} is coming soon`}
      description="We are getting our experts ready. Check back soon."
      action={
        <Button variant="outline" asChild>
          <Link href={audience === "GENTS" ? SIDES[other].href : "/home-service"}>
            {audience === "GENTS" ? `See ${SIDES[other].title}` : "About Home Service"}
          </Link>
        </Button>
      }
    />
  );
}

function OutOfArea({ audience }: { audience: HomeAudience }) {
  return (
    <>
      <HomeTrack event="home_out_of_area" dim={trackSide(audience)} />
      <EmptyState
        icon={MapPinOff}
        title="Not in your area yet"
        description="No salon offers Home Service at this location yet. Try another address, or book a visit at a salon nearby."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <ChangeLocationButton />
            <Button variant="ghost" asChild>
              <Link href={`/salons?audience=${audience}`}>Find a salon</Link>
            </Button>
          </div>
        }
      />
    </>
  );
}

function LoadFailed({ message }: { message: string }) {
  return <EmptyState icon={SearchX} title="Couldn't load this list" description={message} />;
}

async function ChipsLoader({
  audience,
  point,
  category,
  view,
}: {
  audience: HomeAudience;
  point: Point;
  category?: HomeCategory;
  view: HomeView;
}) {
  // Same request as the service grid, so Next serves both from one fetch.
  const res = await getHomeCatalog({ audience, ...point });
  if (!res.success || !res.data || res.data.outOfArea) return null;
  return (
    <HomeCategoryChips
      view={view}
      categories={res.data.categories}
      totals={{ services: res.data.offerings.length, experts: res.data.expertCount }}
      active={category}
    />
  );
}

/** "11 services · come to Banasree, Dhaka" above a grid. */
function ResultsHeading({ count, noun, place, note }: { count: number; noun: string; place: string | null; note?: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
        {count} {noun}
        {count === 1 ? "" : "s"}
        <span className="font-sans text-base font-normal text-muted-foreground">
          {place ? ` come to ${place}` : " near you"}
        </span>
      </h2>
      {note && <p className="text-sm text-muted-foreground">{note}</p>}
    </div>
  );
}

async function ServiceResults({
  audience,
  point,
  place,
  category,
  searchParams,
}: {
  audience: HomeAudience;
  point: Point;
  place: string | null;
  category?: HomeCategory;
  searchParams: Params;
}) {
  const res = await getHomeCatalog({ audience, ...point });
  if (!res.success || !res.data) return <LoadFailed message={res.message} />;
  if (res.data.outOfArea) return <OutOfArea audience={audience} />;

  const offerings = res.data.offerings.filter((o) => !category || o.category === category);
  if (!offerings.length) {
    return (
      <EmptyState
        icon={SearchX}
        title={category ? `No ${CATEGORY_LABEL[category].toLowerCase()} near you yet` : "No services near you yet"}
        description="Try another category or location."
      />
    );
  }

  // A service opens its experts: the same point, filtered to its category.
  const hrefFor = (c: HomeCategory) => {
    const p = new URLSearchParams();
    if (searchParams.lat && searchParams.lng) {
      p.set("lat", searchParams.lat);
      p.set("lng", searchParams.lng);
    }
    p.set("view", "expert");
    p.set("category", c);
    return `${SIDES[audience].href}?${p}`;
  };

  return (
    <div>
      <ResultsHeading
        count={offerings.length}
        noun={category ? `${CATEGORY_LABEL[category].toLowerCase()} service` : "service"}
        place={place}
        note="Tap a service to see who does it"
      />
      <div className={HOME_GRID}>
        {offerings.map((o) => (
          <OfferingCard key={`${o.category}:${o.name}`} offering={o} href={hrefFor(o.category)} />
        ))}
      </div>
    </div>
  );
}

async function ExpertResults({
  audience,
  point,
  place,
  category,
  sort,
  page,
  policyLine,
}: {
  audience: HomeAudience;
  point: Point;
  place: string | null;
  category?: HomeCategory;
  sort: HomeExpertSort;
  page: number;
  policyLine: string;
}) {
  const res = await getHomeExperts({ audience, ...point, category, sort, page });
  if (!res.success || !res.data) return <LoadFailed message={res.message} />;
  if (res.data.outOfArea) return <OutOfArea audience={audience} />;

  const { experts } = res.data;
  const total = res.meta?.total ?? experts.length;
  if (!experts.length) {
    return (
      <EmptyState
        icon={SearchX}
        title={category ? `No ${CATEGORY_LABEL[category].toLowerCase()} experts near you yet` : "No experts near you yet"}
        description="Try another category or location."
      />
    );
  }

  const at = `lat=${point.lat}&lng=${point.lng}`;
  return (
    <div>
      <ResultsHeading
        count={total}
        noun={`${category ? `${CATEGORY_LABEL[category].toLowerCase()} ` : ""}${audience === "LADIES" ? "female " : ""}expert`}
        place={place}
        note={`${SORT_LABEL[sort]} first`}
      />
      <div className={HOME_GRID}>
        {experts.map((e) => (
          <ExpertCard key={e.id} expert={e} href={`/home-service/experts/${e.id}?${at}`} policyLine={policyLine} />
        ))}
      </div>
      <HomePagination page={page} total={total} pageSize={PAGE_SIZE} />
    </div>
  );
}
