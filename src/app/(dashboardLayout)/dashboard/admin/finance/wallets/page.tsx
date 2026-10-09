import { getAdminMe } from "@/services/admin/getAdminMe";
import { getWalletDetail } from "@/services/admin/finance/getWalletDetail";
import { searchWallets } from "@/services/admin/finance/searchWallets";
import { can } from "@/lib/admin-permissions";
import { WalletsClient } from "./WalletsClient";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/** `?q=` searches; `?user=<id>` opens that wallet (and `?page=` its history). */
export default async function WalletsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = (first(params.q) ?? "").trim();
  const userId = (first(params.user) ?? "").trim();
  const page = Math.max(1, Math.floor(Number(first(params.page))) || 1);

  const [hits, detail, me] = await Promise.all([
    q.length >= 2 ? searchWallets(q) : null,
    userId ? getWalletDetail(userId, page) : null,
    getAdminMe(),
  ]);
  const permissions = me.success ? (me.data?.permissions ?? []) : [];

  return (
    <WalletsClient
      q={q}
      userId={userId}
      page={page}
      hits={hits}
      detail={detail}
      canAdjust={can(permissions, "finance.wallet_adjust")}
      canFreeze={can(permissions, "finance.wallet_freeze")}
    />
  );
}
