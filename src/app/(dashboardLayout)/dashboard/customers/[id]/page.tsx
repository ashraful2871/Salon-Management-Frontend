import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/Shared/PageHeader";
import { ErrorState } from "@/components/Shared/ErrorState";
import { CustomerProfile } from "@/components/Owner/customers/CustomerProfile";
import { getOwnerCustomer } from "@/services/owner/getOwnerCustomer";

export const metadata = { title: "Customer" };
export const dynamic = "force-dynamic";

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Every branch the caller may see: a customer of another branch is still theirs.
  const result = await getOwnerCustomer(id);

  if (!result.success || !result.data) {
    if (/not found/i.test(result.message ?? "")) notFound();
    return <ErrorState message={result.message} />;
  }

  return (
    <div>
      <Link
        href="/dashboard/customers"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden="true" /> Customers
      </Link>
      <PageHeader title={result.data.customer.name} description="Visits, spend and your private notes." />
      <CustomerProfile data={result.data} />
    </div>
  );
}
