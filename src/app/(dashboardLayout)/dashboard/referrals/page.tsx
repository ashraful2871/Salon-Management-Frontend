import { ReferPage, type ReferList } from "@/components/Referral/ReferPage";
import { referralTermsOf } from "@/lib/referral-terms";
import { shareMessageOf } from "@/lib/referral-view";
import { getMyFriends } from "@/services/referral/getMyFriends";
import { getMyReferral } from "@/services/referral/getMyReferral";
import { getMyRewards } from "@/services/referral/getMyRewards";
import type { ReferralListResponse } from "@/services/referral/request";
import { getPublicSettings, referralSettingsOf } from "@/services/settings/getPublicSettings";

export const metadata = { title: "Refer & earn" };

type SearchParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** "Show more" loads one page more (20 each); the cap keeps a hand-typed URL small. */
const MAX_PAGES = 10;
const pagesOf = (v: string | undefined) => Math.min(Math.max(Math.floor(Number(v)) || 1, 1), MAX_PAGES);
const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

/** Pages 1..n of a list, joined; the first failure is the error, the first page's meta the total. */
const joinPages = <T,>(pages: ReferralListResponse<T[]>[]): ReferList<T> => {
  const loaded = pages.filter((p) => p.success);
  const items = loaded.flatMap((p) => p.data ?? []);
  return {
    items,
    total: pages[0]?.success ? (pages[0].meta?.total ?? items.length) : items.length,
    pages: pages.length,
    error: pages.find((p) => !p.success)?.message ?? null,
  };
};

/**
 * `/dashboard/referrals` (CUSTOMER): every read in parallel on the server, so
 * the page arrives whole. `?rewards=` / `?friends=` are how many pages of each
 * list "Show more" has opened; `?invite=own` comes from `/r/<code>` while signed in.
 */
export default async function ReferralsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const rewardPages = pagesOf(one(sp.rewards));
  const friendPages = pagesOf(one(sp.friends));

  const [meRes, rewardRes, friendRes, settingsRes] = await Promise.all([
    getMyReferral(),
    Promise.all(range(rewardPages).map((p) => getMyRewards(undefined, p))),
    Promise.all(range(friendPages).map((p) => getMyFriends(p))),
    getPublicSettings(),
  ]);

  const settings = referralSettingsOf(settingsRes.success ? settingsRes.data : null);
  const me = meRes.success ? (meRes.data ?? null) : null;

  return (
    <ReferPage
      me={me}
      meError={me ? null : meRes.message}
      terms={me?.terms ?? referralTermsOf(settings)}
      shareMessage={me ? shareMessageOf(me) : null}
      programOn={me?.programOn ?? settings["referral.enabled"]}
      redemptionsOn={settings["referral.redemptionsEnabled"]}
      restoreOnCancel={settings["referral.restoreOnCancel"]}
      inviteOwn={one(sp.invite) === "own"}
      rewards={joinPages(rewardRes)}
      friends={joinPages(friendRes)}
      now={new Date()}
    />
  );
}
