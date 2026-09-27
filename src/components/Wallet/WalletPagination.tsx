"use client";

import Pagination from "@/components/Shared/Pagination";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";

/** Pages live in the URL (`?page=`); the list above dims while the next loads. */
export default function WalletPagination({
  page,
  totalPages,
  total,
  pageSize,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
}) {
  const { navigate, isPending } = useFilterNavigation();

  return (
    <Pagination
      page={page}
      totalPages={totalPages}
      total={total}
      pageSize={pageSize}
      itemLabel="transactions"
      disabled={isPending}
      onPageChange={(next) =>
        navigate(next > 1 ? `/dashboard/wallet?page=${next}` : "/dashboard/wallet", {
          scroll: false,
        })
      }
    />
  );
}
