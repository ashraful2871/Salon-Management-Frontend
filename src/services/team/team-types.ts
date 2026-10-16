/** A seat at a branch (`salon_members`). */
export type BranchRole = "MANAGER" | "RECEPTIONIST" | "STYLIST";
export type MemberStatus = "ACTIVE" | "SUSPENDED" | "REMOVED";

/** `GET /salons/:salonId/members`. */
export type TeamMember = {
  id: string;
  userId: string;
  role: BranchRole;
  status: MemberStatus;
  /** A stylist's Staff row at this branch (hours, time off); null for other roles. */
  staffId: string | null;
  name: string;
  email: string;
  phone: string | null;
  profilePhoto: string | null;
  joinedAt: string;
  removedAt: string | null;
  notifyNewBookings: boolean;
  /** PENDING/CONFIRMED bookings from today with this stylist (0 for other roles). */
  upcomingBookings: number;
};

/** `GET /salons/:salonId/invitations` (pending only). */
export type TeamInvitation = {
  id: string;
  email: string;
  name: string | null;
  role: BranchRole;
  expiresAt: string;
  createdAt: string;
  invitedById: string;
  inviterName: string | null;
  expired: boolean;
};

/** `POST /salons/:salonId/invitations`. `inviteUrl` only when the email failed. */
export type InviteResult = {
  id: string;
  email: string;
  role: BranchRole;
  expiresAt: string;
  emailSent: boolean;
  inviteUrl?: string;
};

/** `GET /invitations/preview?token=`. */
export type TeamInvitationPreview = {
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  role: BranchRole;
  salon: { id: string; name: string; area: string | null; address: string | null };
  businessName: string | null;
  inviterName: string | null;
  maskedEmail: string;
  expiresAt: string;
  /** null when signed out. */
  forYou: boolean | null;
  callerEmailVerified: boolean | null;
};

export const ROLE_LABEL: Record<BranchRole, string> = {
  MANAGER: "Manager",
  RECEPTIONIST: "Receptionist",
  STYLIST: "Stylist",
};
