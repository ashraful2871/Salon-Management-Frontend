import type { Metadata } from "next";
import { renderSupport, type SupportSearch } from "@/components/Admin/support/renderSupport";

export const metadata: Metadata = {
  title: "Support | Admin",
  description: "Support tickets from the contact form",
};

export default async function AdminSupportPage({ searchParams }: { searchParams: Promise<SupportSearch> }) {
  return renderSupport(await searchParams);
}
