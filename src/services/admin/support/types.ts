export type TicketStatus = "OPEN" | "PENDING" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type AdminTicketFilters = {
  status?: string;
  assignee?: string;
  category?: string;
  priority?: string;
  q?: string;
  sort?: string;
  page?: number;
};

export type AdminTicketRow = {
  id: string;
  number: number;
  source: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: string | null;
  assigneeName: string | null;
  userId: string | null;
  appointmentId: string | null;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** OPEN with no reply after 24 h. */
  slaBreached: boolean;
};

export type AdminTicketListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  statusCounts: Partial<Record<TicketStatus, number>>;
};

export type SupportMessage = {
  id: string;
  ticketId: string;
  authorType: "CUSTOMER" | "ADMIN" | "SYSTEM";
  authorId: string | null;
  authorName: string;
  body: string;
  internal: boolean;
  emailedAt: string | null;
  createdAt: string;
};

export type AdminTicketDetail = AdminTicketRow & {
  messages: SupportMessage[];
  user: { id: string; name: string; email: string; role: string; status: string; createdAt: string } | null;
  booking: {
    id: string;
    token: string | null;
    status: string;
    appointmentDate: string;
    depositStatus: string;
    salon: { id: string; name: string };
    service: { name: string } | null;
  } | null;
};

export type SupportAssignee = { id: string; name: string };
