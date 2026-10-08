// Shapes the admin services return. The API sends more on some of them; only
// what the screens read is typed.

export type AdminMfaState = {
  enrolled: boolean;
  enabledAt: string | null;
  /** Open step-up window, or null when a tier-3 action would ask for a code. */
  stepUpUntil: string | null;
  recoveryCodesLeft: number;
};

export type AdminMe = {
  userId: string;
  name: string | null;
  email: string | null;
  accountRole: "ADMIN" | "AGENT";
  adminRole: string | null;
  permissions: string[];
  area: string | null;
  mfa: AdminMfaState;
};

export type MfaSetup = { otpauthUrl: string; qrDataUrl: string; manualKey: string };

export type RecoveryCodes = { recoveryCodes: string[] };

export type InvitationPreview = {
  status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
  kind: "ADMIN" | "AGENT";
  adminRole: string | null;
  area: string | null;
  district: string | null;
  division: string | null;
  inviterName: string | null;
  maskedEmail: string | null;
  expiresAt: string;
  /** null when the visitor is signed out. */
  forYou: boolean | null;
  callerEmailVerified: boolean | null;
};

/** One "Needs attention" row from `GET /admin/inbox`; only open work (count > 0) is sent. */
export type AdminInboxItem = {
  key: string;
  count: number;
  oldestAt?: string | null;
  /** A deadline (appeals: 48 h from the oldest). */
  dueAt?: string | null;
  tone: "danger" | "warning" | "info";
  href: string;
};

/** One `GET /admin/search` result, already filtered by the caller's permissions. */
export type AdminSearchHit = {
  kind: "user" | "salon" | "booking" | "intent" | "payout";
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
};

export type AdminNoteEntity = "user" | "salon" | "booking" | "payout" | "intent" | "wallet";

export type AdminNote = {
  id: string;
  entityType: AdminNoteEntity;
  entityId: string;
  body: string;
  pinned: boolean;
  authorId: string;
  authorName: string | null;
  createdAt: string;
};
