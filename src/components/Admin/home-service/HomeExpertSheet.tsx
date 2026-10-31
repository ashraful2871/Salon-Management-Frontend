"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronDown, ChevronUp, ExternalLink, FileText, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useStepUp } from "@/components/Admin/StepUpDialog";
import { formatDhaka } from "@/components/Admin/Timeline";
import { useClock } from "@/components/Admin/useClock";
import SafeImage from "@/components/Shared/SafeImage";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { getAdminHomeExpertDocuments } from "@/services/home-service/getAdminHomeExpertDocuments";
import type { AdminHomeExpertDocuments, AdminHomeExpertRow, HomeDocKind } from "@/services/home-service/types";
import { EXPERT_STATUS_LABELS, GENDER_LABELS, SIDE_LABELS } from "./labels";

const DOCS: { kind: HomeDocKind; label: string }[] = [
  { kind: "ID_FRONT", label: "ID front" },
  { kind: "ID_BACK", label: "ID back" },
  { kind: "SELFIE", label: "Selfie" },
];

const isPdf = (format: string) => format.toLowerCase() === "pdf";

/**
 * The three documents side by side. Fetched when the panel mounts: each fetch
 * writes an audit row and signs links for 5 minutes, so nothing is prefetched.
 * The request is tier 3, so opening may ask for a step-up code first.
 */
function DocumentsPanel({ expertId }: { expertId: string }) {
  const { run, dialog } = useStepUp();
  const now = useClock();
  const [docs, setDocs] = useState<AdminHomeExpertDocuments | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const started = useRef(false);

  const load = useCallback(() => {
    startTransition(async () => {
      const result = await run(() => getAdminHomeExpertDocuments(expertId));
      setError(result.success && result.data ? null : result.message);
      if (result.success && result.data) setDocs(result.data);
    });
  }, [expertId, run]);

  useEffect(() => {
    // Strict Mode mounts twice in development: one open, one audit row.
    if (started.current) return;
    started.current = true;
    load();
  }, [load]);

  const expired = !!docs && now != null && now >= new Date(docs.expiresAt).getTime();

  return (
    <section aria-labelledby="expert-docs-title" className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="expert-docs-title" className="text-sm font-semibold">
          Documents
        </h3>
        <p className="text-xs text-muted-foreground">
          Viewing is logged
          {docs && !expired && ` · links expire at ${formatDhaka(docs.expiresAt)}`}
        </p>
      </div>

      {pending && !docs ? (
        <p className="flex items-center gap-2 rounded-xl border border-border p-4 text-sm text-muted-foreground">
          <Loader2 aria-hidden className="size-4 animate-spin" /> Opening the documents…
        </p>
      ) : error ? (
        <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
          <p className="text-danger">{error}</p>
          <Button size="sm" variant="outline" onClick={load}>
            Try again
          </Button>
        </div>
      ) : expired ? (
        <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
          <p className="text-muted-foreground">These links have expired.</p>
          <Button size="sm" variant="outline" disabled={pending} onClick={load}>
            <RefreshCw aria-hidden className="size-3.5" />
            Open again
          </Button>
        </div>
      ) : docs ? (
        <ul className="grid gap-3 md:grid-cols-3">
          {DOCS.map(({ kind, label }) => {
            const doc = docs.documents[kind];
            return (
              <li key={kind} className="min-w-0 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                {!doc ? (
                  <p className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-border text-sm text-danger">
                    Missing
                  </p>
                ) : isPdf(doc.format) ? (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl border border-border text-sm text-primary hover:bg-surface-subtle"
                  >
                    <FileText aria-hidden className="size-6" />
                    Open PDF
                  </a>
                ) : (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="relative block aspect-[4/3] overflow-hidden rounded-xl border border-border bg-surface-subtle"
                  >
                    {/* Never through the optimizer: it would keep a copy of an ID after the link expires. */}
                    <SafeImage
                      src={doc.url}
                      alt={label}
                      fill
                      unoptimized
                      referrerPolicy="no-referrer"
                      sizes="(min-width: 768px) 280px, 100vw"
                      className="object-contain"
                    />
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
      {dialog}
    </section>
  );
}

const Fact = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="text-sm">{children}</dd>
  </div>
);

/** The verification sheet. Full screen on phones, wide enough on desktop for three documents. */
export function HomeExpertSheet({
  expert,
  position,
  total,
  canVerify,
  pending,
  onClose,
  onStep,
  onVerify,
  onDialog,
}: {
  expert: AdminHomeExpertRow | null;
  position: number;
  total: number;
  canVerify: boolean;
  pending: boolean;
  onClose: () => void;
  onStep: (delta: 1 | -1) => void;
  onVerify: (expert: AdminHomeExpertRow) => void;
  onDialog: (kind: "reject" | "suspend" | "gender", expert: AdminHomeExpertRow) => void;
}) {
  const state = expert?.verification;
  const canApprove = state === "PENDING" || state === "SUSPENDED";
  const profileGender = expert?.staff.userGender;
  const genderDiffers = !!expert && !!profileGender && profileGender !== expert.gender;

  return (
    <Sheet open={!!expert} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex h-dvh w-full max-w-none flex-col gap-0 p-0 sm:max-w-3xl">
        {expert && (
          <>
            <SheetHeader className="border-b border-border px-5 py-4 text-left">
              <div className="flex items-center gap-3 pr-8">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-surface-subtle">
                  <SafeImage src={expert.staff.photo} alt="" fill sizes="48px" className="object-cover" />
                </div>
                <div className="min-w-0">
                  <SheetTitle className="truncate">{expert.staff.name}</SheetTitle>
                  <SheetDescription className="truncate">{expert.salon.name}</SheetDescription>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 pt-2">
                <ToneBadge status={expert.verification}>{EXPERT_STATUS_LABELS[expert.verification]}</ToneBadge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>
                    {position + 1} of {total}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Previous expert"
                    disabled={position <= 0}
                    onClick={() => onStep(-1)}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Next expert"
                    disabled={position >= total - 1}
                    onClick={() => onStep(1)}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Fact label="Staff name">{expert.staff.name}</Fact>
                <Fact label="Declared gender">{GENDER_LABELS[expert.gender]}</Fact>
                <Fact label="Side">{SIDE_LABELS[expert.audience]}</Fact>
                <Fact label="Sent">{expert.submittedAt ? formatDhaka(expert.submittedAt) : "Not yet"}</Fact>
              </dl>

              {genderDiffers && (
                <p className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning-soft/60 p-3 text-sm text-warning">
                  <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
                  Their account says {profileGender?.toLowerCase()}, but they were declared{" "}
                  {expert.gender.toLowerCase()}. Check the ID.
                </p>
              )}

              {canVerify ? (
                <DocumentsPanel key={expert.id} expertId={expert.id} />
              ) : (
                <p className="rounded-xl border border-border p-3 text-sm text-muted-foreground">
                  Documents open only for admins who verify experts.
                </p>
              )}

              {expert.rejectReason && (
                <section className="space-y-1">
                  <h3 className="text-sm font-semibold">Last decision</h3>
                  <p className="text-sm text-muted-foreground">{expert.rejectReason}</p>
                </section>
              )}

              <Link
                href={`/dashboard/admin/salons/${expert.salon.id}`}
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Open the salon page
                <ExternalLink aria-hidden className="size-3.5" />
              </Link>
            </div>

            {canVerify && (
              <SheetFooter className="flex-row flex-wrap justify-end gap-2 border-t border-border px-5 py-3">
                <Button
                  variant="ghost"
                  className="mr-auto"
                  disabled={pending}
                  onClick={() => onDialog("gender", expert)}
                >
                  Change gender…
                </Button>
                {(state === "PENDING" || state === "VERIFIED") && (
                  <Button variant="outline" disabled={pending} onClick={() => onDialog("suspend", expert)}>
                    Suspend…
                  </Button>
                )}
                {state === "PENDING" && (
                  <Button variant="outline" disabled={pending} onClick={() => onDialog("reject", expert)}>
                    Reject…
                  </Button>
                )}
                {canApprove && (
                  <Button disabled={pending} onClick={() => onVerify(expert)}>
                    {pending && <Loader2 aria-hidden className="animate-spin" />}
                    Verify
                  </Button>
                )}
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
