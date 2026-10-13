import { guardRoute } from "@/lib/auth-guard";
import { PageHeader } from "@/components/Shared/PageHeader";
import { MoneyTabs } from "@/components/Money/MoneyTabs";

/**
 * The owner's Money hub. Role gate from `ROUTE_ROLES` (business owner only);
 * each tab is its own page under this header.
 */
export default async function Layout({ children }: { children: React.ReactNode }) {
  await guardRoute("/dashboard/money");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Money"
        description="What is clearing, what comes Monday, what is on its way and what was paid."
      />
      <MoneyTabs />
      {children}
    </div>
  );
}
