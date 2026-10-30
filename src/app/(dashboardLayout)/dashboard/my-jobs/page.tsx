import { BriefcaseBusiness } from "lucide-react";

import MyJobs from "@/components/HomeService/jobs/MyJobs";
import { EmptyState } from "@/components/Shared/EmptyState";
import { PageHeader } from "@/components/Shared/PageHeader";
import { getMyJobs } from "@/services/home-service/getMyJobs";

export const metadata = { title: "My jobs" };

type SearchParams = Record<string, string | string[] | undefined>;

/** /dashboard/my-jobs: the home expert's visits, today and the next 7 days. */
export default async function MyJobsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [res, sp] = await Promise.all([getMyJobs(), searchParams]);
  const id = Array.isArray(sp.id) ? sp.id[0] : sp.id;

  return (
    <>
      <PageHeader title="My jobs" />
      {!res.success || !res.data ? (
        <EmptyState title="We couldn't load your jobs" description={res.message} />
      ) : !res.data.isExpert ? (
        <EmptyState
          icon={BriefcaseBusiness}
          title="You're not a home expert"
          description="Your salon owner can set you up for home visits. Your jobs will show here once you're verified."
        />
      ) : (
        <MyJobs initial={res.data} focusId={id ?? null} />
      )}
    </>
  );
}
