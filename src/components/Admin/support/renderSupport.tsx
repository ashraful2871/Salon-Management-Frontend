import { SupportInbox } from "@/components/Admin/support/SupportInbox";
import { can } from "@/lib/admin-permissions";
import { getAdminMe } from "@/services/admin/getAdminMe";
import { getSupportAssignees } from "@/services/admin/support/getSupportAssignees";
import { getTicket } from "@/services/admin/support/getTicket";
import { getTickets } from "@/services/admin/support/getTickets";
import type { AdminTicketFilters } from "@/services/admin/support/types";

export type SupportSearch = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

/**
 * Shared by `/support` and `/support/[id]`: the list (the URL is its state),
 * the open ticket when there is one, and what this admin may do.
 */
export async function renderSupport(sp: SupportSearch, ticketId?: string) {
  const filters: AdminTicketFilters = {
    status: one(sp.status),
    assignee: one(sp.assignee),
    category: one(sp.category),
    priority: one(sp.priority),
    q: one(sp.q),
    sort: one(sp.sort),
    page: Math.max(1, Number(one(sp.page)) || 1),
  };

  const [list, ticket, assignees, me] = await Promise.all([
    getTickets(filters),
    ticketId ? getTicket(ticketId) : Promise.resolve(undefined),
    getSupportAssignees(),
    getAdminMe(),
  ]);
  const permissions = me.success ? me.data?.permissions : undefined;

  return (
    <SupportInbox
      list={list}
      filters={filters}
      ticket={ticket}
      assignees={assignees.success && Array.isArray(assignees.data) ? assignees.data : []}
      meId={me.success ? (me.data?.userId ?? null) : null}
      canReply={can(permissions, "support.reply")}
      canAssign={can(permissions, "support.assign")}
    />
  );
}
