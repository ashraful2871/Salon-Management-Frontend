import { getApprovals } from "@/services/admin/approvals/getApprovals";
import type { ApprovalStatus } from "@/services/admin/approvals/types";
import { ApprovalsClient } from "./ApprovalsClient";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const STATUSES: (ApprovalStatus | "ALL")[] = ["PENDING", "EXECUTED", "FAILED", "REJECTED", "EXPIRED", "ALL"];

export default async function ApprovalsPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = (await searchParams).status;
  const value = (Array.isArray(raw) ? raw[0] : raw)?.toUpperCase();
  const status = STATUSES.includes(value as ApprovalStatus) ? (value as ApprovalStatus | "ALL") : "PENDING";

  return <ApprovalsClient status={status} response={await getApprovals(status)} />;
}
