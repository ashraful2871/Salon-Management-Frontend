import Link from "next/link";
import { PageHeader } from "@/components/Shared/PageHeader";
import { ErrorState } from "@/components/Shared/ErrorState";
import { NotificationsClient } from "@/components/Notifications/NotificationsClient";
import { getNotifications } from "@/services/notifications/getNotifications";

export const metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function NotificationsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const unreadOnly = params.show === "unread";
  const result = await getNotifications({ unread: unreadOnly });

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={
          <>
            What happened at your branches. Choose what reaches you in{" "}
            <Link href="/dashboard/settings#notifications" className="font-medium text-primary-hover underline-offset-4 hover:underline">
              Settings
            </Link>
            .
          </>
        }
      />
      {!result.success || !result.data ? (
        <ErrorState message={result.message} />
      ) : (
        <NotificationsClient
          key={unreadOnly ? "unread" : "all"}
          initial={result.data.items}
          nextCursor={result.data.nextCursor}
          unread={result.data.unread}
          unreadOnly={unreadOnly}
        />
      )}
    </div>
  );
}
