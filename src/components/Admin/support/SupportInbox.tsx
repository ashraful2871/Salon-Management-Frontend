"use client";

import { MessagesSquare } from "lucide-react";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ErrorState } from "@/components/Shared/ErrorState";
import { PageHeader } from "@/components/Shared/PageHeader";
import { FilterNavigationProvider } from "@/hooks/useFilterNavigation";
import type { ApiResponse } from "@/lib/api-types";
import { cn } from "@/lib/utils";
import type {
  AdminTicketDetail,
  AdminTicketFilters,
  AdminTicketRow,
  SupportAssignee,
} from "@/services/admin/support/types";
import { TicketConversation } from "./TicketConversation";
import { TicketList, ticketQuery } from "./TicketList";

/**
 * Two panes from `lg` up (list | conversation). On phones the list is
 * `/support` and a ticket is `/support/[id]`, one pane at a time.
 */
export function SupportInbox({
  list,
  filters,
  ticket,
  assignees,
  meId,
  canReply,
  canAssign,
}: {
  list: ApiResponse<AdminTicketRow[]>;
  filters: AdminTicketFilters;
  /** Absent on `/support`. */
  ticket?: ApiResponse<AdminTicketDetail>;
  assignees: SupportAssignee[];
  meId: string | null;
  canReply: boolean;
  canAssign: boolean;
}) {
  const selectedId = ticket?.success ? ticket.data?.id : undefined;
  const open = ticket !== undefined;

  return (
    <div className="min-w-0">
      <PageHeader
        title="Support"
        description="Contact-form messages as tickets. Replies go out by email; internal notes stay here."
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className={cn("min-w-0", open && "max-lg:hidden")}>
          <FilterNavigationProvider>
            <TicketList response={list} filters={filters} selectedId={selectedId} assignees={assignees} />
          </FilterNavigationProvider>
        </div>
        <section className={cn("min-w-0", !open && "max-lg:hidden")} aria-label="Conversation">
          {!ticket ? (
            <EmptyState
              icon={MessagesSquare}
              title="Pick a ticket"
              description="Choose a ticket on the left to read and answer it."
            />
          ) : !ticket.success || !ticket.data ? (
            <ErrorState title="Couldn't load this ticket" message={ticket.message} />
          ) : (
            <TicketConversation
              key={ticket.data.id}
              ticket={ticket.data}
              assignees={assignees}
              meId={meId}
              canReply={canReply}
              canAssign={canAssign}
              backHref={`/dashboard/admin/support${ticketQuery(filters)}`}
            />
          )}
        </section>
      </div>
    </div>
  );
}
