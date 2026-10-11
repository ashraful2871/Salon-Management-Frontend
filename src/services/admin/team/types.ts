import type { AccountStatus } from "../users/types";
import type { PendingInvitation } from "../agents/types";

export const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "OPERATIONS",
  "FINANCE",
  "SUPPORT",
  "MODERATOR",
  "ANALYST",
] as const;
export type AdminRoleName = (typeof ADMIN_ROLES)[number];

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  profilePhoto: string | null;
  status: AccountStatus;
  lastActiveAt: string | null;
  createdAt: string;
  adminRole: AdminRoleName | null;
  mfaEnabled: boolean;
};

export type AdminTeam = { members: TeamMember[]; invitations: PendingInvitation[] };
