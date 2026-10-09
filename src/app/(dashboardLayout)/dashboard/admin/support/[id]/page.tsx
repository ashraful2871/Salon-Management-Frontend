import type { Metadata } from "next";
import { renderSupport, type SupportSearch } from "@/components/Admin/support/renderSupport";

export const metadata: Metadata = {
  title: "Ticket | Support | Admin",
};

/** One ticket: beside the list from `lg` up, on its own on phones. */
export default async function AdminTicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SupportSearch>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  return renderSupport(sp, id);
}
