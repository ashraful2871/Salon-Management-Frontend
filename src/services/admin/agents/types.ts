import type { AccountStatus } from "../users/types";

export type AreaOption = { division: string; district: string; area: string; salons: number };

export type PendingInvitation = {
  id: string;
  email: string;
  name: string | null;
  adminRole: string | null;
  division: string | null;
  district: string | null;
  area: string | null;
  expiresAt: string;
  createdAt: string;
  invitedBy: string | null;
  /** Past its expiry: can be resent, not accepted. */
  expired: boolean;
};

export type AdminAgent = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profilePhoto: string | null;
  division: string;
  district: string;
  area: string;
  status: AccountStatus;
  statusReason: string | null;
  lastActiveAt: string | null;
  mfaEnabled: boolean;
  createdAt: string;
};

export type AdminAgentsData = { agents: AdminAgent[]; invitations: PendingInvitation[] };

export type InvitationResult = {
  id: string;
  email: string;
  expiresAt: string;
  emailSent: boolean;
  /** Only when the email failed: pass the link on yourself. */
  inviteUrl?: string;
};
