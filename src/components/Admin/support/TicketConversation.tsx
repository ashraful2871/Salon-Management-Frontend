"use client";

import { useId, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarClock, Loader2, Send, User2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDhaka } from "@/components/Admin/Timeline";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { showResultToast } from "@/components/Shared/showResultToast";
import { cn } from "@/lib/utils";
import { replyToTicket } from "@/services/admin/support/replyToTicket";
import { updateTicket } from "@/services/admin/support/updateTicket";
import type {
  AdminTicketDetail,
  SupportAssignee,
  SupportMessage,
  TicketPriority,
  TicketStatus,
} from "@/services/admin/support/types";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_PRIORITY_ORDER,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_ORDER,
  TICKET_STATUS_TONE,
} from "./labels";

const NONE = "none";

type Fields = { status: TicketStatus; assigneeId: string | null; priority: TicketPriority; category: string };

/**
 * The right pane of the support inbox: the messages, a composer that either
 * emails the requester or adds an internal note, and the ticket's status,
 * assignee, priority and category with the linked user and booking.
 */
export function TicketConversation({
  ticket,
  assignees,
  meId,
  canReply,
  canAssign,
  backHref,
}: {
  ticket: AdminTicketDetail;
  assignees: SupportAssignee[];
  meId: string | null;
  canReply: boolean;
  canAssign: boolean;
  backHref: string;
}) {
  const ids = useId();
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [sending, startSend] = useTransition();
  const [saving, startSave] = useTransition();

  const [messages, addMessage] = useOptimistic(ticket.messages, (state, m: SupportMessage) => [...state, m]);
  const [fields, patchFields] = useOptimistic<Fields, Partial<Fields>>(
    { status: ticket.status, assigneeId: ticket.assigneeId, priority: ticket.priority, category: ticket.category },
    (state, patch) => ({ ...state, ...patch }),
  );

  const send = () => {
    const text = body.trim();
    if (!text) return;
    startSend(async () => {
      addMessage({
        id: `pending-${Date.now()}`,
        ticketId: ticket.id,
        authorType: "ADMIN",
        authorId: meId,
        authorName: "You",
        body: text,
        internal,
        emailedAt: null,
        createdAt: new Date().toISOString(),
      });
      const result = await replyToTicket(ticket.id, { body: text, internal });
      if (result.success) {
        setBody("");
        if (!internal && result.data && !result.data.emailed) toast.warning(result.message);
        else toast.success(result.message);
      } else {
        showResultToast(result);
      }
    });
  };

  const save = (patch: Partial<Fields>) =>
    startSave(async () => {
      patchFields(patch);
      const result = await updateTicket(ticket.id, patch);
      if (!result.success) showResultToast(result);
    });

  const assigneeName = (id: string | null) =>
    id ? (assignees.find((a) => a.id === id)?.name ?? ticket.assigneeName ?? "Admin") : "Unassigned";

  return (
    <div className="min-w-0 space-y-4">
      <div className="space-y-1">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> All tickets
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="min-w-0 font-heading text-lg font-semibold break-words">
            <span className="text-muted-foreground tabular-nums">#{ticket.number}</span> {ticket.subject}
          </h2>
          <ToneBadge status={fields.status} tone={TICKET_STATUS_TONE[fields.status]}>
            {TICKET_STATUS_LABELS[fields.status]}
          </ToneBadge>
        </div>
        <p className="text-sm text-muted-foreground break-all">
          {ticket.name} · {ticket.email} · opened {formatDhaka(ticket.createdAt)}
        </p>
        {ticket.slaBreached && (
          <ToneBadge status="SLA" tone="warning" dot>
            No reply in 24 h
          </ToneBadge>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-w-0 space-y-4">
          <ol className="space-y-3" aria-label="Messages">
            {messages.map((m) => {
              const pending = m.id.startsWith("pending-");
              return (
                <li
                  key={m.id}
                  className={cn(
                    "rounded-2xl border p-4",
                    m.internal
                      ? "border-dashed bg-muted"
                      : m.authorType === "CUSTOMER"
                        ? "bg-surface"
                        : "bg-primary-soft/40",
                    pending && "opacity-60",
                  )}
                >
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {m.authorName}
                      {m.internal && <span className="ml-2 font-normal text-muted-foreground">Internal note</span>}
                    </span>
                    <span>
                      {formatDhaka(m.createdAt)}
                      {m.authorType === "ADMIN" && !m.internal && !pending && (
                        <> · {m.emailedAt ? "Emailed" : "Not emailed"}</>
                      )}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-line break-words">{m.body}</p>
                </li>
              );
            })}
          </ol>

          {canReply && (
            <Card className="gap-0 py-0">
              <CardContent className="space-y-3 p-4">
                <Label htmlFor={`${ids}-body`} className="sr-only">
                  {internal ? "Internal note" : "Reply"}
                </Label>
                <Textarea
                  id={`${ids}-body`}
                  rows={4}
                  maxLength={5000}
                  placeholder={internal ? "A note only admins see" : `Reply to ${ticket.name} by email`}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className={cn(internal && "bg-muted")}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Switch id={`${ids}-internal`} checked={internal} onCheckedChange={setInternal} />
                    <Label htmlFor={`${ids}-internal`} className="text-sm">
                      Internal note
                    </Label>
                  </div>
                  <Button type="button" disabled={sending || !body.trim()} onClick={send}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
                    {internal ? "Add note" : "Send reply"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-4" aria-label="Ticket details" aria-busy={saving}>
          <Card className="gap-0 py-0">
            <CardContent className="space-y-3 p-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select
                  disabled={!canAssign}
                  value={fields.status}
                  onValueChange={(v) => save({ status: v as TicketStatus })}
                >
                  <SelectTrigger className="w-full" aria-label="Status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_STATUS_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>
                        {TICKET_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs text-muted-foreground">Assignee</Label>
                  {canAssign && meId && fields.assigneeId !== meId && assignees.some((a) => a.id === meId) && (
                    <button
                      type="button"
                      className="text-xs font-medium text-primary hover:underline"
                      onClick={() => save({ assigneeId: meId })}
                    >
                      Assign to me
                    </button>
                  )}
                </div>
                <Select
                  disabled={!canAssign}
                  value={fields.assigneeId ?? NONE}
                  onValueChange={(v) => save({ assigneeId: v === NONE ? null : v })}
                >
                  <SelectTrigger className="w-full" aria-label="Assignee">
                    <SelectValue>{assigneeName(fields.assigneeId)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Unassigned</SelectItem>
                    {assignees.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Priority</Label>
                <Select
                  disabled={!canAssign}
                  value={fields.priority}
                  onValueChange={(v) => save({ priority: v as TicketPriority })}
                >
                  <SelectTrigger className="w-full" aria-label="Priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_PRIORITY_ORDER.map((p) => (
                      <SelectItem key={p} value={p}>
                        {TICKET_PRIORITY_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Select disabled={!canAssign} value={fields.category} onValueChange={(v) => save({ category: v })}>
                  <SelectTrigger className="w-full" aria-label="Category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TICKET_CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 py-0">
            <CardContent className="space-y-1 p-4 text-sm">
              <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <User2 className="h-3.5 w-3.5" aria-hidden /> Linked account
              </p>
              {ticket.user ? (
                <>
                  <Link href={`/dashboard/admin/users/${ticket.user.id}`} className="font-medium hover:underline">
                    {ticket.user.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {ticket.user.role.replace(/_/g, " ").toLowerCase()} · {ticket.user.status.toLowerCase()}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">No account with this email</p>
              )}
            </CardContent>
          </Card>

          <Card className="gap-0 py-0">
            <CardContent className="space-y-1 p-4 text-sm">
              <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" aria-hidden /> Linked booking
              </p>
              {ticket.booking ? (
                <>
                  <Link href={`/dashboard/admin/bookings/${ticket.booking.id}`} className="font-medium hover:underline">
                    {ticket.booking.token ?? "Booking"}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {ticket.booking.salon.name}
                    {ticket.booking.service ? ` · ${ticket.booking.service.name}` : ""} ·{" "}
                    {formatDhaka(ticket.booking.appointmentDate)}
                  </p>
                  <ToneBadge status={ticket.booking.status} />
                </>
              ) : (
                <p className="text-muted-foreground">No booking code in the message</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
