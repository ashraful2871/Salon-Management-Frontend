import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft, Briefcase, Languages, MapPin, ShieldCheck, Star, Store, TriangleAlert, UserX } from "lucide-react";

import { EmptyState } from "@/components/Shared/EmptyState";
import SafeImage from "@/components/Shared/SafeImage";
import { Button } from "@/components/ui/button";
import { isInBangladesh, roundCoord } from "@/lib/geo";
import { LOCATION_COOKIE, parseSavedLocation } from "@/lib/location-cookie";
import { formatBDT } from "@/lib/money";
import { TONE_CLASSES } from "@/lib/status-tone";
import { cn } from "@/lib/utils";
import { getHomeExpert } from "@/services/home-service/getHomeExpert";
import type { HomeExpertDetail, HomeReview } from "@/services/home-service/types";
import { SIDES, trackSide } from "./content";
import { ExpertAvatar, RatingLine, VerifiedBadge, kmText } from "./HomeCards";
import ExpertMenu from "./ExpertMenu";
import { HomeTrack } from "./HomeTrack";

const toNumber = (v?: string) => (v == null || v.trim() === "" ? NaN : Number(v));

const dateText = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dhaka" });

/**
 * /home-service/experts/[id]: who the expert is, their home menu with a Book
 * bar, the cancellation terms in force (the API's own disclaimer text) and
 * their reviews. Distance and reach use the URL point, else the saved one.
 */
export default async function ExpertProfile({
  id,
  searchParams,
}: {
  id: string;
  searchParams: { [key: string]: string | undefined };
}) {
  const saved = parseSavedLocation((await cookies()).get(LOCATION_COOKIE)?.value);
  const lat = toNumber(searchParams.lat);
  const lng = toNumber(searchParams.lng);
  const point = isInBangladesh(lat, lng)
    ? { lat: roundCoord(lat), lng: roundCoord(lng) }
    : saved
      ? { lat: saved.lat, lng: saved.lng }
      : {};
  const reviewPage = Math.max(1, Math.floor(toNumber(searchParams.reviewPage)) || 1);

  const res = await getHomeExpert(id, { ...point, reviewPage });
  if (!res.success || !res.data) {
    const gone = res.errorCode === "EXPERT_UNAVAILABLE" || /not found/i.test(res.message);
    return (
      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          icon={UserX}
          title={gone ? "This expert isn't taking home bookings right now" : "Couldn't load this expert"}
          description={gone ? "Pick another expert near you." : res.message}
          action={
            <Button variant="outline" asChild>
              <Link href="/home-service">Back to Home Service</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const e = res.data;
  const side = SIDES[e.audience];
  return (
    <>
      <HomeTrack event="home_expert_view" dim={trackSide(e.audience)} />
      <Hero expert={e} />

      <div className="container mx-auto space-y-12 px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        {e.servesYou === false && (
          <p
            role="status"
            className={cn(
              "flex gap-3 rounded-2xl p-4 text-sm",
              TONE_CLASSES.warning.soft,
              TONE_CLASSES.warning.text,
            )}
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {e.salon.name} doesn&apos;t come to your saved location. You can still look, or{" "}
              <Link href={side.href} className="font-semibold underline underline-offset-2">
                see experts who do
              </Link>
              .
            </span>
          </p>
        )}

        <section aria-labelledby="expert-menu">
          <h2 id="expert-menu" className="mb-5 font-display text-2xl font-semibold text-foreground">
            Services at home
          </h2>
          {e.menu.length ? (
            <ExpertMenu expertId={e.id} menu={e.menu} />
          ) : (
            <p className="text-sm text-muted-foreground">No services listed right now.</p>
          )}
        </section>

        <section aria-labelledby="expert-policy" className="max-w-3xl">
          <div className="rounded-3xl border border-gold/25 bg-primary-soft p-5 sm:p-6">
            <h2 id="expert-policy" className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <ShieldCheck className="size-5 text-primary" aria-hidden />
              Payment &amp; cancellation
            </h2>
            <p className="mt-2 text-sm font-semibold text-foreground">
              Pay {e.policy.advancePercent}% now, {100 - e.policy.advancePercent}% at home.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{e.policy.disclaimer}</p>
            {(e.salon.minOrderMinor > 0 || e.salon.travelFeeMinor > 0) && (
              <p className="mt-2 text-sm text-muted-foreground">
                {[
                  e.salon.minOrderMinor > 0 && `Minimum order ${formatBDT(e.salon.minOrderMinor)}`,
                  e.salon.travelFeeMinor > 0 && `Travel fee ${formatBDT(e.salon.travelFeeMinor)}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                .
              </p>
            )}
          </div>
        </section>

        <Reviews expert={e} reviewPage={reviewPage} searchParams={searchParams} />

        <Button variant="ghost" asChild>
          <Link href={side.href}>
            <ArrowLeft aria-hidden />
            All {side.title} experts
          </Link>
        </Button>
      </div>
    </>
  );
}


function Hero({ expert: e }: { expert: HomeExpertDetail }) {
  const ladies = e.audience === "LADIES";
  return (
    <section className={cn("border-b", ladies ? "border-gold/20 bg-glow-gold" : "border-border/60 bg-surface-subtle bg-glow-soft")}>
      <div className="container mx-auto flex flex-col items-center gap-6 px-4 py-8 text-center sm:px-6 md:flex-row md:items-start md:py-12 md:text-left lg:px-8">
        <ExpertAvatar name={e.name} photo={e.photo} className="size-28 text-3xl ring-4 md:size-32" />
        <div className="min-w-0 flex-1">
          <p className="text-overline font-semibold uppercase tracking-[0.06em] text-primary">{SIDES[e.audience].title}</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{e.name}</h1>
            <VerifiedBadge />
          </div>
          {e.headline && <p className="mt-2 text-base text-muted-foreground sm:text-lg">{e.headline}</p>}

          <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm md:justify-start">
            <li className="inline-flex items-center">
              <RatingLine rating={e.rating} reviews={e.totalReviews} />
            </li>
            <li className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Briefcase className="size-4" aria-hidden />
              {e.completedJobs} home job{e.completedJobs === 1 ? "" : "s"} done
            </li>
            {e.experienceYears ? (
              <li className="text-muted-foreground">{e.experienceYears}+ years&apos; experience</li>
            ) : null}
            {e.languages.length > 0 && (
              <li className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Languages className="size-4" aria-hidden />
                {e.languages.join(", ")}
              </li>
            )}
          </ul>

          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm md:justify-start">
            <Store className="size-4 text-muted-foreground" aria-hidden />
            <Link href={`/salons/${e.salon.id}`} className="font-semibold text-foreground underline-offset-2 hover:underline">
              {e.salon.name}
            </Link>
            {e.salon.area && <span className="text-muted-foreground">· {e.salon.area}</span>}
            {e.distanceKm != null && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                · <MapPin className="size-3.5" aria-hidden />
                {kmText(e.distanceKm)} away
              </span>
            )}
          </p>

          {(e.bio || e.speciality) && (
            <div className="mt-4 max-w-2xl space-y-2 text-sm leading-relaxed text-muted-foreground">
              {e.speciality && (
                <p>
                  <span className="font-semibold text-foreground">Speciality:</span> {e.speciality}
                </p>
              )}
              {e.bio && <p className="whitespace-pre-line">{e.bio}</p>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Reviews({
  expert: e,
  reviewPage,
  searchParams,
}: {
  expert: HomeExpertDetail;
  reviewPage: number;
  searchParams: { [key: string]: string | undefined };
}) {
  const { items, meta } = e.reviews;
  const pageHref = (p: number) => {
    const q = new URLSearchParams(
      Object.entries(searchParams).filter((kv): kv is [string, string] => typeof kv[1] === "string"),
    );
    if (p > 1) q.set("reviewPage", String(p));
    else q.delete("reviewPage");
    const qs = q.toString();
    return `/home-service/experts/${e.id}${qs ? `?${qs}` : ""}#expert-reviews`;
  };

  return (
    <section aria-labelledby="expert-reviews" className="max-w-3xl scroll-mt-24">
      <h2 id="expert-reviews" className="mb-5 font-display text-2xl font-semibold text-foreground">
        Reviews
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((r) => (
            <ReviewItem key={r.id} review={r} />
          ))}
        </ul>
      )}
      {meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between gap-3">
          {reviewPage > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={pageHref(reviewPage - 1)} scroll={false}>Newer</Link>
            </Button>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted-foreground tabular-nums">
            {reviewPage} / {meta.totalPages}
          </span>
          {reviewPage < meta.totalPages ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={pageHref(reviewPage + 1)} scroll={false}>Older</Link>
            </Button>
          ) : (
            <span />
          )}
        </div>
      )}
    </section>
  );
}

function ReviewItem({ review: r }: { review: HomeReview }) {
  return (
    <li className="rounded-3xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted">
          <SafeImage src={r.customer.photo} alt="" fill sizes="40px" className="object-cover" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{r.customer.name}</p>
          <p className="text-xs text-muted-foreground">{dateText(r.createdAt)}</p>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-foreground">
          <Star className="size-4 fill-current text-gold" aria-hidden />
          {r.rating}
        </span>
      </div>
      {r.services.length > 0 && <p className="mt-3 text-xs text-muted-foreground">{r.services.join(" · ")}</p>}
      {r.comment && <p className="mt-2 text-sm leading-relaxed text-foreground/90">{r.comment}</p>}
      {r.ownerReply && (
        <p className="mt-3 rounded-2xl bg-muted/60 p-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Salon reply:</span> {r.ownerReply}
        </p>
      )}
    </li>
  );
}
